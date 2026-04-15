# TradeBook QA Learning Portal

An AI-powered learning and Gherkin-authoring tool for Bloomberg TradeBook QA analysts.
Covers the full equity trade lifecycle, FIX Protocol message flows, and Gherkin .feature file generation.

**Companion project:** [fix-protocol-tool](https://github.com/ken-jiang-claude/fix-protocol-tool)

---

## What does this do?

| Tab | What you get |
|---|---|
| **Learn** | Browse 9 QA test scenarios. Each shows the FIX message flow, required tags, acceptance criteria, pass/fail signs, RCA tags, and a Gherkin preview. |
| **Gherkin Writer** | Two modes: (1) select a built-in scenario and generate a template-based `.feature` file; (2) describe any test in plain English and let AI generate a clean Gherkin file instantly. Copy, download, or save either output. |
| **Ask AI** | Claude-powered chat. Ask about FIX tags, OrdStatus transitions, Gherkin syntax, edge cases, or RCA guidance. |

---

## Scenarios covered

- Environment: QA login, session health
- Lifecycle: New order, modify (cancel-replace), cancel
- Execution: Partial fill, full fill
- Post-trade: Settlement report and RHUB validation
- Edge cases: Cancel-replace chain integrity, IOC and FOK order types

---

## AI Gherkin Generator

The **Gherkin Writer** tab includes an AI-powered generator. Describe your test scenario in plain English and Claude produces a clean `.feature` file in seconds.

**How to use:**

1. Go to the **Gherkin Writer** tab
2. Scroll past the scenario dropdown to the **"or describe your scenario"** section
3. Type a plain-language description, for example:
   > QA analyst logs in with QA account and submits a new order to buy 100 shares of AAPL at $15 limit price
4. Click **✦ Generate with AI**
5. The `.feature` file streams into the editor — edit, copy, download, or save to history

**What it generates:**

- A `Feature` block with a plain-language description
- A happy-path `Scenario` with `Given / When / Then` steps
- One or more negative scenarios covering rejection and invalid input cases
- Each negative scenario ends with `And the failure reason is "..."` as the last step
- `@module` and `@priority` tags on every scenario

**Domain rules enforced:**

The generator respects the order state machine — it will never produce a scenario that modifies or cancels a `Filled`, `Cancelled`, or `Rejected` order. Modify and cancel only target valid states: `New`, `PendingNew`, `PartiallyFilled`, or `PendingReplace`.

---

## Run locally

```bash
git clone https://github.com/YOUR_USERNAME/tradebook-qa-portal
cd tradebook-qa-portal
pip install -r requirements.txt
python web_app.py
```

Open [http://localhost:5001](http://localhost:5001). You will be prompted for your Anthropic API key on first run — it is saved to `.api_key` locally.

---

## Deploy to Render.com

1. Push to GitHub
2. Create a new **Web Service** on [Render.com](https://render.com) and connect your repo
3. Set the environment variable `ANTHROPIC_API_KEY` in the Render dashboard
4. Deploy — Render auto-deploys on every push to `main`

---

## Stack

Python 3.12 · Flask 3.1 · Claude (claude-haiku-4-5) · SQLite · Vanilla JS · marked.js

---

*Built for Fintech QA professionals. Reference standard: FIXimate.*
