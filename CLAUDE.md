# CLAUDE.md — TradeBook QA Learning Portal

## Project Overview

An AI-powered learning and Gherkin-authoring portal for Bloomberg TradeBook QA analysts.
Covers the full equity trade lifecycle with FIX Protocol grounding and Claude-powered chat.

- **Owner:** Ken Jiang
- **Companion project:** github.com/ken-jiang-claude/fix-protocol-tool
- **Version:** 1.0

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.12 |
| Web framework | Flask 3.1 |
| AI model | claude-haiku-4-5 (Anthropic) |
| Streaming | Server-Sent Events (SSE) via Flask stream_with_context |
| Database | SQLite (qa_history.db) — ephemeral on Render.com |
| Production server | gunicorn (Procfile) |
| Hosting | Render.com (auto-deploy from GitHub main) |
| Frontend | Vanilla JS + marked.js (CDN) |

---

## Key Files

| File | Purpose |
|---|---|
| `web_app.py` | Flask app — routes, SSE streaming, SQLite, API key resolution |
| `templates/index.html` | Single-page frontend — Learn, Gherkin Writer, Ask AI tabs |
| `Procfile` | gunicorn start command for Render.com |
| `requirements.txt` | anthropic, flask, gunicorn |
| `docs/README.md` | User manual |

---

## Features

### Learn Tab
- 9 QA scenarios across Environment, Lifecycle, Execution, Post-Trade, and Edge Cases
- FIX message flow diagram per scenario (hover for MsgType tooltips)
- Key FIX tags table with tag numbers, required/conditional flags
- Pass signs, fail indicators, RCA tags, evidence keys
- Gherkin preview with syntax highlighting
- Module filter sidebar

### Gherkin Writer Tab
- Select any scenario from dropdown
- Toggle: FIX tag comments, data tables, evidence comments, RCA annotations
- Generate, edit, copy, download (.feature), and save to DB
- **AI Generator** — describe a test in plain English → Claude streams a clean Gherkin `.feature` file
  - Output: plain Given/When/Then, @module/@priority tags, failure reason as last step in negative scenarios
  - Enforces order state machine: no modify/cancel on terminal states (Filled, Cancelled, Rejected)
  - Route: `POST /api/gherkin/generate` (SSE streaming, same pattern as `/api/chat`)

### Ask AI Tab (Claude-powered)
- Streaming chat via SSE
- QA-focused system prompt covering FIX tags, OrdStatus transitions, Gherkin guidance, RCA
- 7 quick-prompt buttons for common QA questions
- Template inserter for scenario/FIX/Gherkin stubs
- Save and reload conversation history (SQLite)

---

## Scenarios Covered

| ID | Module | Scenario |
|---|---|---|
| ENV_LOGIN_001 | Environment | QA Login & Environment Check |
| ENV_SESSION_002 | Environment | Session Health & Connectivity |
| ORD_NEW_010 | Lifecycle | New Order — Single Equity |
| ORD_MOD_011 | Lifecycle | Order Modify (Cancel-Replace) |
| ORD_CXL_012 | Lifecycle | Order Cancel |
| EXEC_PARTIAL_020 | Execution | Partial Fill |
| EXEC_FULL_021 | Execution | Full Fill |
| SETTLE_RHUB_030 | Post-Trade | Settlement & RHUB Validation |
| EDGE_CXL_REPLACE_070 | Edge Cases | Cancel-Replace Chain Integrity |
| EDGE_IOC_FOK_090 | Edge Cases | IOC and FOK Order Types |

---

## Claude API Usage

- **Model:** claude-haiku-4-5 — cost-effective for QA chat
- **Do NOT use** claude-opus-4-6 or claude-sonnet-4-6 without explicit request
- API key resolved via resolve_api_key() in web_app.py: env var → .api_key file → interactive prompt
- On Render.com: set ANTHROPIC_API_KEY as environment variable in the dashboard

---

## Running Locally

```bash
git clone https://github.com/YOUR_USERNAME/tradebook-qa-portal
cd tradebook-qa-portal
pip install -r requirements.txt
python web_app.py
# Open http://localhost:5001
```

API key saved to .api_key on first run — no need to re-enter.

---

## Deployment (Render.com)

1. Push to GitHub
2. Create new Web Service on Render.com → connect repo
3. Set environment variable: ANTHROPIC_API_KEY
4. Deploy — auto-deploys on every push to main

Note: SQLite history is lost on redeploy (free tier ephemeral disk).

---

## Sensitive Files (never commit)

- `.api_key` — local API key (gitignored)
- `qa_history.db` — SQLite database (gitignored)

---

## Roadmap

- [ ] Add remaining 30 edge case scenarios from addendum v2
- [ ] Multi-leg / basket order scenarios
- [ ] Gherkin export as zip (all scenarios)
- [ ] Migrate SQLite to PostgreSQL for persistent history
- [ ] User auth for team use
- [x] AI Gherkin Generator — plain English → `.feature` file (added v1.1)
