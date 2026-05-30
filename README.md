# Debate2.0 🎤🔥 - Advanced Multi-Agent AI Debate Platform

Welcome to **Debate2.0**, a premium web application that orchestrates advanced, multi-agent logic showdowns using a state-of-the-art **LangGraph** workflow. 

Put two AI agents head-to-head on any debate topic, supported by an automated real-time fact-checker that keeps arguments grounded in reality, and an impartial judge that issues the final verdict!

---

## ✦ System Overview & Architecture

Debate2.0 displays the true capability of structured multi-agent collaboration, utilizing a robust, cyclic state graph to manage round progression, fact-check disputes, and final judicial verdict evaluation.

```mermaid
graph TD
    A[Topic Generator Node] -->|Seeds propositions| B(PRO Debater Node)
    B -->|Logs Turn| C{Fact Check Node}
    D(CON Debater Node) -->|Logs Turn| C
    C -->|Evaluates Claims| E[Fact Check Router Node]
    E -->|Valid| F[Debate Moderator Node]
    E -->|Failed - Back for retry| B
    F -->|Next turn/round| D
    F -->|Concluded| G[Judge Node]
    G -->|Final Decision & Rationale| H[CSV Export / Session History]
```

### 🤖 Core Agents & Workflow Nodes
* **`GenerateTopicNode`**: Refines proposition inputs and establishes clear stances.
* **`ProDebaterNode` & `ConDebaterNode`**: Generate structured, persuasive arguments backing their respective positions using contextual memories of prior turns.
* **`FactCheckNode`**: Evaluates active debater claims for accuracy. If a hallucination or inaccuracy is flagged, the agent is issued an infraction and routed back to reconstruct their stance.
* **`DebateModeratorNode`**: Manages structural limits, rounds of debate, and automatically handles disqualification if an agent triggers excessive fact-check failures.
* **`JudgeNode`**: Impartially parses the debate, determining the winner and delivering a conversational, human-friendly summary verdict.

---

## ✦ Premium Key Features

### 1. Isolated Session-bound History Tracking (`user_id`)
* **Session Persistence:** Generates a persistent unique `user_id` inside the browser's `localStorage`.
* **Personalized History:** Past debates lists are queried using standard `GET` requests bound to this session ID (`/debates?user_id=...`), showing users only their own historical session debates.
* **Backward-Compatible SQLite Migrations:** Seamlessly checks database tables at startup and automatically migrates the structure with an `ALTER TABLE debates ADD COLUMN user_id TEXT` action if not present.

### 2. Beautiful Judge Verdict Summaries
* **Conversational Judgments:** The Judge LLM prompt is engineered to output structured, conversational conclusions starting exactly like: `"Comparing the debate of both, we conclude that [the winner] is best because [reason]..."` rather than long dry technical breakdowns.
* **Prominent Real-Time UI Rationale Card:** When a debate concludes, a dedicated card pops up immediately under the Winner Banner displaying this human-friendly concluding justification.

### 3. High-Fidelity CSV Exports
* **Native Downloads:** The `/export` endpoint leverages FastAPI's `FileResponse` to initiate browser file downloads seamlessly.
* **Human-Readable Footer Summaries:** Exported CSVs are safe-encoded in `utf-8` and conclude with a beautiful, formatted **Debate Conclusion Summary** footer showing the decision results and the judge's full plain-English explanation.

### 4. Gorgeous Premium Styling
* Standardized navbar title branding **Debate2.0** mirroring the landing page typography, styling, and adding a sparkling star `✦` when dark mode is enabled.
* Highly polished, accessible royal purple (`#7c5cbf`) action button on the homepage with smooth hover indicators.

---

## 🛠️ Technology Stack

* **Backend:** FastAPI, LangGraph, Pydantic, LangChain Core, SQLite, Uvicorn
* **Frontend:** React (Vite), Vanilla CSS, SSE (Server-Sent Events) Stream Reader

---

## 🚀 Quick Start Guide

### 1. Setup Backend
Open your terminal in the root workspace directory:

```bash
# Install core dependencies
pip install -r requirements.txt

# Create your environmental configuration (.env)
echo GROQ_API_KEY="your_groq_api_key_here" > .env

# Run the FastAPI server
uvicorn api.main:app --reload --port 8000
```
The API backend will start running live at `http://localhost:8000`.

### 2. Setup Frontend
Navigate to the `frontend` folder:

```bash
cd frontend

# Install package dependencies
npm install

# Run the development server
npm run dev
```
Open `http://localhost:5173` in your browser to experience **Debate2.0**!

---

## 🧪 Running Unit Tests
A comprehensive test suite is available under `/tests` to verify workflow routers, retry limits, LLM output structures, and parsing fallbacks.

```bash
# Execute unit tests
pytest
```
