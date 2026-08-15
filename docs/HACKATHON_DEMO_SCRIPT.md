# 🎬 Anamnesis — Tier-1 Hackathon Winning Demo Video Script
**Target Duration:** 2:30 – 3:00 minutes  
**Event:** CockroachDB × AWS Hackathon: Build with Agentic Memory  
**Target Audience:** Hackathon Judges, Web3 Security Engineers, AI Researchers

---

## 📽️ Scene-by-Scene Script & Visual Teleprompter

### ⏱️ 0:00 – 0:30 | SECTION 1: THE HOOK & THE CRITICAL VULNERABILITY
**Visuals on Screen:**
- Show **Landing Page Hero** (`http://localhost:5173/`) scrolling down smoothly to the **Decision DNA** interactive animation.
- Subtle cursor hovering over the animated Decision DNA risk bars.

**Voiceover Script:**
> *"In the autonomous AI Agent Economy on OKX X Layer, thousands of agents execute sub-second micropayments every day. But existing security tools have a fatal flaw: **Single-Snapshot Blindness**.*
> 
> *A single-point-in-time check only asks: 'Is this wallet safe right now?' It cannot see across time. Wash traders and sybil networks exploit this by staying just under detection thresholds in separate sessions — passing every snapshot while orchestrating multi-session fraud.*
> 
> *To solve this, we built **Anamnesis** — the persistent decision memory layer for AI agents, powered by CockroachDB Cloud Serverless and AWS Bedrock."*

---

### ⏱️ 0:30 – 1:15 | SECTION 2: ARCHITECTURE & CLOUD INFRASTRUCTURE
**Visuals on Screen:**
- Switch to **System Status Page** (`http://localhost:5173/dashboard/system`).
- Show all 3 green connected indicators: **CockroachDB Cloud**, **Amazon Bedrock**, and **OKX X Layer Testnet**.
- Briefly show the Architecture Sequence Diagram from the `README.md`.

**Voiceover Script:**
> *"Anamnesis gives security engines persistent, searchable memory across time.*
> 
> *Here's how it works: Every time a transaction is evaluated, Anamnesis transforms the risk profile into a **1024-dimensional vector embedding** using **Amazon Titan Text Embeddings v2**.*
> 
> *This vector is stored inside **CockroachDB Cloud Serverless** in AWS `us-east-1`, indexed using CockroachDB's native **C-SPANN vector index**.*
> 
> *When a new transaction arrives, Anamnesis queries CockroachDB in under 35 milliseconds via dual-path retrieval — matching exact wallet history AND semantic vector similarity. Then, **Amazon Bedrock Claude Sonnet** synthesizes a verdict, explicitly citing historical precedents."*

---

### ⏱️ 1:15 – 2:00 | SECTION 3: THE LIVE TWO-PASS DEMO (THE PROOF)
**Visuals on Screen:**
- Click on **Live Demo Page** (`http://localhost:5173/dashboard/demo`).
- Click **"Run Pass 1 (First Evaluation — No Memory)"**.
- Point out the generated CockroachDB UUID (`990d382f...`).
- Click **"Run Pass 2 (Re-Evaluation — With Memory)"**.
- **CRITICAL PAUSE**: Hover cursor over the **Raw CockroachDB Memory Retrieval Card** (`✦ 1 exact match`, `0.0000 distance`, `ID: #990d382f`) BEFORE scrolling to the verdict!
- Highlight the **Precedent Found** pill and the **Cited Precedent ID** in the reasoning text.

**Voiceover Script:**
> *"Let's prove this live.*
> 
> *In **Pass 1**, an unverified wallet requests 50 OKB for a service. The single snapshot engine evaluates the wallet as thin-history and returns **CAUTION** with a Split Payment structure. Anamnesis synchronously commits this decision fingerprint to CockroachDB.*
> 
> *Now watch **Pass 2**. Moments later, the same wallet attempts another transaction. Anamnesis instantly queries CockroachDB.*
> 
> *Look at the raw CockroachDB memory trace card: This isn't Claude claiming to remember — this is the actual database row retrieved from CockroachDB with an exact address match.*
> 
> *And look at the synthesized reasoning text: Bedrock explicitly cites Precedent `#990d382f`, notes that this is a repeat check on the same counterparty, and reinforces caution. Memory caught what point-in-time scanning missed."*

---

### ⏱️ 2:00 – 2:30 | SECTION 4: ARCHITECTURAL RESILIENCE (FAIL-OPEN & ANTI-HALLUCINATION)
**Visuals on Screen:**
- Navigate to **Overview Command Center** (`http://localhost:5173/dashboard`).
- Point out the **Recent Memory Stream** thin-bar activity log and the **FAIL-OPEN RESILIENT** status badge.

**Voiceover Script:**
> *"We stress-tested Anamnesis against real-world failures.*
> 
> *First, **Anti-Hallucination Validation**: Every precedent ID cited by Bedrock is strictly cross-checked against CockroachDB row sets. Fake LLM citations are stripped before reaching the response.*
> 
> *Second, **Fail-Open Downtime Resilience**: If CockroachDB Cloud or Bedrock ever experiences network latency or outage, Anamnesis falls back near-instantly to deterministic on-chain signals tagged with fallback reasoning. Agent payments on X Layer never freeze."*

---

### ⏱️ 2:30 – 3:00 | SECTION 5: CONCLUSION & IMPACT
**Visuals on Screen:**
- Show the GitHub repository (`https://github.com/GreatSage-dev/Anamnesis`) with the clean README and audit docs.
- End on the **Anamnesis Liquid Glass Orb Logo** floating in the top nav.

**Voiceover Script:**
> *"Anamnesis bridges the gap between static point-in-time checks and long-term memory for autonomous agent security.*
> 
> *With CockroachDB Cloud Serverless vector indexing and Amazon Bedrock intelligence, AI agents on OKX X Layer can now trade with institutional confidence.*
> 
> *Thank you, and explore our full open-source codebase on GitHub at GreatSage-dev/Anamnesis!"*

---

<div align="center">
  <sub>Script updated for 100% factual alignment with codebase & empirical benchmarks</sub>
</div>
