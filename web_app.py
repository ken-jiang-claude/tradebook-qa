"""
TradeBook QA Learning Portal
Backend: Flask + Anthropic Claude (claude-haiku-4-5)
Companion to: github.com/ken-jiang-claude/fix-protocol-tool
"""

import json
import os
import sqlite3
import uuid
from datetime import datetime
from flask import Flask, render_template, request, Response, jsonify, stream_with_context
import anthropic

app = Flask(__name__)

# ---------------------------------------------------------------------------
# System prompt — QA-focused, FIX-grounded
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an expert QA advisor for Bloomberg TradeBook, specialising in
equity trading test scenarios and the FIX Protocol (Financial Information Exchange).

Your role:
1. SCENARIO LEARNING — Explain TradeBook QA test scenarios in plain language.
   - Cover the full trade lifecycle: Environment → New Order → Modify → Cancel →
     Reject → Partial Fill → Full Fill → Settlement → RHUB → History → Positions.
   - For every scenario state the acceptance criteria, pass signs, fail indicators,
     and the likely root cause if it fails.
   - Refer to the relevant FIX message type (e.g. NewOrderSingle MsgType=D,
     ExecutionReport MsgType=8) and the key FIX tags involved.

2. FIX PROTOCOL REFERENCE — Answer FIX tag and message questions precisely.
   Use FIXimate tag numbers. Format raw FIX messages in Tag=Value|Tag=Value notation
   with pipe (|) as delimiter. Always include header tags 8, 9, 35, 49, 56, 34, 52, 10.

   Key message types relevant to TradeBook QA:
   - D  = NewOrderSingle          (new order)
   - G  = OrderCancelReplaceRequest (modify/replace)
   - F  = OrderCancelRequest      (cancel)
   - 8  = ExecutionReport         (acks, fills, rejects)
   - 9  = OrderCancelReject       (cancel/replace reject)
   - AE = TradeCaptureReport      (post-trade)
   - J  = AllocationInstruction   (allocation)
   - A  = Logon                   (session)
   - 0  = Heartbeat               (session keepalive)
   - 2  = ResendRequest           (gap fill)
   - 4  = SequenceReset           (gap fill response)

   Critical OrdStatus (tag 39) values:
   0=New, 1=PartiallyFilled, 2=Filled, 4=Canceled, 5=Replaced,
   6=PendingCancel, 8=Rejected, A=PendingNew, E=PendingReplace

   Critical ExecType (tag 150) values:
   0=New, 4=Canceled, 5=Replaced, 8=Rejected, F=Trade (fill), I=OrderStatus

3. GHERKIN GUIDANCE — Help analysts write well-structured Gherkin (.feature) files.
   - Use Given/When/Then/And structure.
   - Include FIX tag references as comments or in data tables.
   - Tag scenarios with @module, @priority, @fix_message.
   - Always include evidence capture comments at the end of each scenario.

4. EDGE CASES — Explain high-risk edge cases: cancel-replace chains, IOC/FOK,
   multi-leg baskets, race conditions, session recovery, and reconciliation breaks.

5. RCA SUPPORT — Help classify failures using standard RCA tags:
   environment | auth | entitlement | static_data | connectivity |
   dependency | sequence_management | state_machine | product_defect

Always be precise, cite FIX tag numbers, and keep answers actionable for a QA analyst
working in a non-production alpha/beta Bloomberg TradeBook environment."""

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

DB_PATH = os.path.join(os.path.dirname(__file__), "qa_history.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id          TEXT PRIMARY KEY,
                title       TEXT,
                created_at  TEXT,
                messages    TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gherkin_files (
                id           TEXT PRIMARY KEY,
                scenario_id  TEXT,
                title        TEXT,
                content      TEXT,
                created_at   TEXT
            )
        """)

# ---------------------------------------------------------------------------
# Routes — pages
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")

# ---------------------------------------------------------------------------
# Routes — chat API (SSE streaming)
# ---------------------------------------------------------------------------

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    messages = data.get("messages", [])

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY is not set on the server."}), 500

    client = anthropic.Anthropic(api_key=api_key)

    def generate():
        try:
            with client.messages.stream(
                model="claude-haiku-4-5",
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

# ---------------------------------------------------------------------------
# Routes — conversation history
# ---------------------------------------------------------------------------

@app.route("/api/history", methods=["GET"])
def get_history():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, title, created_at FROM conversations ORDER BY created_at DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/history", methods=["POST"])
def save_history():
    data = request.get_json()
    conv_id = str(uuid.uuid4())
    title = data.get("title", "Untitled")[:80]
    messages = json.dumps(data.get("messages", []))
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    with get_db() as conn:
        conn.execute(
            "INSERT INTO conversations VALUES (?, ?, ?, ?)",
            (conv_id, title, created_at, messages),
        )
    return jsonify({"id": conv_id, "title": title, "created_at": created_at})

@app.route("/api/history/<conv_id>", methods=["GET"])
def load_history(conv_id):
    with get_db() as conn:
        row = conn.execute(
            "SELECT messages FROM conversations WHERE id = ?", (conv_id,)
        ).fetchone()
    if row:
        return jsonify({"messages": json.loads(row["messages"])})
    return jsonify({"error": "Not found"}), 404

@app.route("/api/history/<conv_id>", methods=["DELETE"])
def delete_history(conv_id):
    with get_db() as conn:
        conn.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
    return jsonify({"success": True})

# ---------------------------------------------------------------------------
# Routes — Gherkin file save/load
# ---------------------------------------------------------------------------

FEATURES_DIR = os.path.join(os.path.dirname(__file__), "features")

@app.route("/api/gherkin", methods=["POST"])
def save_gherkin():
    data = request.get_json()
    file_id = str(uuid.uuid4())
    scenario_id = data.get("scenario_id", "")
    title = data.get("title", "Untitled")[:80]
    content = data.get("content", "")
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    with get_db() as conn:
        conn.execute(
            "INSERT INTO gherkin_files VALUES (?, ?, ?, ?, ?)",
            (file_id, scenario_id, title, content, created_at),
        )
    # Also write to features/ so the file is visible in the repo
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in scenario_id.lower())
    feature_path = os.path.join(FEATURES_DIR, f"{safe_name}.feature")
    os.makedirs(FEATURES_DIR, exist_ok=True)
    with open(feature_path, "w", encoding="utf-8") as f:
        f.write(content)
    return jsonify({"id": file_id, "title": title, "created_at": created_at})

@app.route("/api/gherkin", methods=["GET"])
def list_gherkin():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, scenario_id, title, created_at FROM gherkin_files ORDER BY created_at DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/gherkin/<file_id>", methods=["GET"])
def load_gherkin(file_id):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM gherkin_files WHERE id = ?", (file_id,)
        ).fetchone()
    if row:
        return jsonify(dict(row))
    return jsonify({"error": "Not found"}), 404

@app.route("/api/gherkin/<file_id>", methods=["DELETE"])
def delete_gherkin(file_id):
    with get_db() as conn:
        conn.execute("DELETE FROM gherkin_files WHERE id = ?", (file_id,))
    return jsonify({"success": True})

@app.route("/api/gherkin/generate", methods=["POST"])
def generate_gherkin_ai():
    data = request.get_json()
    description = data.get("description", "").strip()
    if not description:
        return jsonify({"error": "No description provided"}), 400

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY is not set on the server."}), 500

    client = anthropic.Anthropic(api_key=api_key)

    gherkin_prompt = f"""Generate a clean Gherkin .feature file for the following Bloomberg TradeBook QA test scenario.

User description: {description}

Requirements:
- Output ONLY the .feature file content — no markdown fences, no extra explanation, no comments
- Use proper Gherkin syntax: Feature, Scenario(s), Given/When/Then/And/But
- Include @tags for module and priority (P0/P1/P2) only
- Use plain business language — no FIX tags, no technical annotations
- Use realistic Bloomberg TradeBook field values from the description
- Cover the happy path and at least one negative/edge-case scenario
- Keep each scenario to 4-6 steps maximum — no redundant assertions
- For every negative scenario, the failure reason must be the last step: And the failure reason is "<specific reason>"
- Keep steps concise and readable

Order state machine rules — never violate these:
- Terminal states (Filled, Cancelled, Rejected) cannot be modified or cancelled
- Cancel and Modify only apply to orders in: New, PendingNew, PartiallyFilled, or PendingReplace
- A PartiallyFilled order can be cancelled (remaining qty) but the already-filled qty cannot be reversed
- A Rejected order cannot transition to any other state"""

    def generate():
        try:
            with client.messages.stream(
                model="claude-haiku-4-5",
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": gherkin_prompt}],
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def resolve_api_key():
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if key:
        return key
    key_file = os.path.join(os.path.dirname(__file__), ".api_key")
    if os.path.exists(key_file):
        with open(key_file) as f:
            key = f.read().strip()
        if key:
            os.environ["ANTHROPIC_API_KEY"] = key
            return key
    print("\n" + "=" * 50)
    print("  ANTHROPIC_API_KEY not found.")
    print("  Enter your key once — it will be saved locally.")
    print("=" * 50)
    key = input("  Paste your API key: ").strip()
    if not key:
        print("No key entered. Exiting.")
        raise SystemExit(1)
    with open(key_file, "w") as f:
        f.write(key)
    os.environ["ANTHROPIC_API_KEY"] = key
    print("  Key saved.\n")
    return key

if __name__ == "__main__":
    resolve_api_key()
    init_db()
    port = int(os.environ.get("PORT", 5001))
    print("\n" + "=" * 50)
    print("  TradeBook QA Portal is running!")
    print(f"  Open: http://localhost:{port}")
    print("=" * 50 + "\n")
    app.run(host="0.0.0.0", debug=False, port=port)
