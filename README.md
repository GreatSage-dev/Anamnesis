<div align="center">

# 🧠 Anamnesis
### Persistent Decision Memory Layer for Autonomous Agent Security
**Built for CockroachDB Cloud × AWS Hackathon • Powering Custos (OKX X Layer Agent 7327)**

[![CockroachDB Cloud](https://img.shields.io/badge/CockroachDB-Cloud_Serverless_C--SPANN-6366f1?style=for-the-badge&logo=cockroachlabs)](https://cockroachlabs.cloud)
[![Amazon Bedrock](https://img.shields.io/badge/AWS_Bedrock-Titan_v2_%2B_Claude_3.5_Sonnet-FF9900?style=for-the-badge&logo=amazonaws)](https://aws.amazon.com/bedrock/)
[![OKX X Layer](https://img.shields.io/badge/OKX_X_Layer-Testnet_1952-000000?style=for-the-badge&logo=okx)](https://testrpc.xlayer.tech)
[![Fail--Open Architecture](https://img.shields.io/badge/Resilience-Fail--Open_Fallback-10b981?style=for-the-badge)](#-fail-open-downtime-resilience)

</div>

---

## 🎯 Executive Summary & Innovation

In the autonomous **AI Agent Economy**, thousands of agents execute sub-second transactions, hiring and paying counterparty agents on **OKX X Layer**. 

Existing security mechanisms rely on **point-in-time checks** — evaluating a single snapshot of a wallet's current balance, transaction count, or price deviation.

### The Critical Vulnerability: Single-Snapshot Blindness
A malicious actor or wash-trader can easily bypass single-snapshot security by staying **just under detection thresholds** across separate sessions (e.g. asking for 49 OKB when 50 OKB is the flag limit, or executing 2 near-miss transactions every 24 hours). To a point-in-time scanner, each snapshot looks clean alone.

### The Solution: Anamnesis Decision Memory
**Anamnesis** gives Custos persistent, searchable decision memory across time. Every security evaluation is transformed into a **1024-dimensional vector embedding** (via **Amazon Titan Text Embeddings v2**) and stored inside **CockroachDB Cloud Serverless** with a **C-SPANN vector index**.

When a counterparty is evaluated, Anamnesis retrieves past decisions in `< 25ms` and feeds them to **Amazon Bedrock (Claude 3.5 Sonnet)** to cite exact historical precedents and detect cross-session fraud patterns.

---

## 🏗️ Architecture & Decision Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant Buyer as 🤖 Buyer Agent
    participant Engine as 🛡️ Custos Engine
    participant XLayer as ⛓️ OKX X Layer RPC
    participant CRDB as 🪳 CockroachDB Cloud
    participant Bedrock as 🟧 AWS Bedrock (us-east-1)

    Buyer->>Engine: POST /evaluate { counterparty_address, service_price, category }
    activate Engine

    par Fetch On-Chain Signals & Query Memory
        Engine->>XLayer: eth_getTransactionCount, eth_getBalance, Block Height
        Engine->>Bedrock: Generate 1024-dim Vector (Titan Embeddings v2)
    end

    Bedrock-->>Engine: Vector Embedding [0.042, -0.128, ...]
    
    Engine->>CRDB: Vector Search (C-SPANN Cosine Distance + SQL Metadata Filter)
    CRDB-->>Engine: Historical Precedents (UUIDs, Past Verdicts, Risk Scores)

    Engine->>Engine: Compute Immutable Deterministic Base Verdict

    alt Precedents Found
        Engine->>Bedrock: Synthesize Verdict with Cited Precedent UUIDs (Claude 3.5 Sonnet)
        Bedrock-->>Engine: Synthesis Output + Validated Cited Precedent UUIDs
    else No Precedents
        Engine->>Engine: Fast-path Baseline Synthesis
    end

    Engine->>CRDB: Synchronous Write (Commit Decision + Vector for Read-Your-Own-Writes)
    Engine-->>Buyer: Final Verdict + Cited Precedents + Pipeline Latency Breakdown
    deactivate Engine
```

---

## ⚡ The Live Two-Pass Demo: Proving Memory Shift

Anamnesis features an interactive **Two-Pass Live Demo** that proves how memory shifts security verdicts on stage:

```
┌──────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│  PASS 1: First Evaluation (No Memory)   │    │   PASS 2: Re-Evaluation (With Memory)   │
├──────────────────────────────────────────┤    ├──────────────────────────────────────────┤
│ Counterparty: 0x9999...9999              │    │ Counterparty: 0x9999...9999              │
│ Price: 48 OKB (Threshold: 50 OKB)        │    │ Price: 48 OKB (Threshold: 50 OKB)        │
├──────────────────────────────────────────┤    ├──────────────────────────────────────────┤
│ Precedents Found: None (First Check)     │    │ Precedents Found: ✦ 1 Exact Match        │
│ Verdict: CAUTION                         │    │ Cited UUID: 990d382f-dac6-47c0-a5b2...   │
│ Recommended Structure: Split Payment     │    │ Verdict: DENY / ESCROW (Verdict Shift!) │
│ Stored UUID: 990d382f-dac6-47c0-a5b2...  │    │ Reason: Repeat near-miss pattern caught  │
└──────────────────────────────────────────┘    └──────────────────────────────────────────┘
```

1. **Pass 1 (Commitment)**: Evaluates a wallet staying just below detection thresholds. Custos returns `CAUTION` (Split Payment) and commits the decision fingerprint to **CockroachDB Cloud**.
2. **Pass 2 (Precedent Recall)**: The same wallet attempts another transaction 5 minutes later. Anamnesis instantly queries **CockroachDB C-SPANN index**, retrieves Pass 1's decision, feeds the precedent to **Claude 3.5 Sonnet**, and escalates the verdict to `DENY` / `ESCROW`.

---

## 🥊 Killing Architectural Loopholes & Edge Cases

During engineering, we rigorously audited the system for edge-case vulnerabilities and eliminated every potential loophole:

### Loophole 1: LLM Hallucination of False Precedents
* **Vulnerability**: Generative LLMs might hallucinate non-existent decision UUIDs when synthesizing precedent reasoning.
* **Fix**: Strict **Precedent ID Validation Middleware** in `src/services/bedrockSynthesis.ts`. Synthesized citations are cross-checked against the exact array of UUIDs returned by CockroachDB. Any fabricated UUID is stripped before reaching the response payload.

### Loophole 2: Database / LLM Cloud Outages Blocking Transactions
* **Vulnerability**: If AWS Bedrock or CockroachDB Cloud experiences latency spikes or downtime, agent payments on X Layer could freeze.
* **Fix**: **Fail-Open Downtime Resilience Architecture** in `src/services/anamnesisPipeline.ts`. If CockroachDB or Bedrock times out, Anamnesis falls back to Custos's deterministic base verdict in `< 50ms` tagged with `fallback: true`. Security never compromises system availability.

### Loophole 3: Read-Your-Own-Writes Consistency Gaps
* **Vulnerability**: Asynchronous database writes could cause Pass 2 to execute before Pass 1's vector embedding finishes indexing, missing the precedent.
* **Fix**: **Synchronous Transaction Commit**. Anamnesis blocks Pass 1 completion until CockroachDB confirms row insertion and vector index placement, guaranteeing instant read-your-own-writes consistency.

---

## 🪳 CockroachDB Cloud Schema & Vector Indexing

Anamnesis utilizes CockroachDB Cloud Serverless with native **C-SPANN (Cluster-Segmented Proximity Approximate Nearest Neighbor)** vector indexing:

```sql
CREATE TABLE IF NOT EXISTS custos_decision_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counterparty_address STRING NOT NULL,
  buyer_address STRING,
  service_category STRING NOT NULL,
  service_price DECIMAL(18, 4) NOT NULL,
  verdict STRING NOT NULL,
  recommended_payment STRING NOT NULL,
  risk_score INT NOT NULL,
  decision_vector VECTOR(1024) NOT NULL, -- 1024-dim Titan Embeddings v2
  signals_snapshot JSONB NOT NULL,
  cited_precedent_ids STRING[],
  synthesis_reasoning STRING,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- C-SPANN Vector Index for sub-25ms Cosine Similarity Search
CREATE INDEX IF NOT EXISTS custos_decision_vector_idx 
ON custos_decision_memory USING C_SPANN (decision_vector) 
WITH (distance_function = 'cosine');

-- Secondary B-Tree Index for Counterparty SQL Lookup
CREATE INDEX IF NOT EXISTS custos_decision_counterparty_idx 
ON custos_decision_memory (counterparty_address, created_at DESC);
```

---

## 🌐 Live Production Infrastructure Status

| Service | Component | Region / Details | Status | Latency |
| :--- | :--- | :--- | :---: | :---: |
| **CockroachDB Cloud** | Serverless Cluster (`anamnesis-32019`) | AWS `us-east-1` (N. Virginia) | 🟢 LIVE | ~25 ms |
| **Amazon Bedrock** | Titan Text Embeddings v2 (1024-dim) | AWS `us-east-1` | 🟢 LIVE | ~780 ms |
| **Amazon Bedrock** | Claude 3.5 Sonnet (`us.anthropic...`) | AWS `us-east-1` | 🟢 LIVE | ~850 ms |
| **OKX X Layer** | Testnet RPC (Chain ID 1952) | `https://testrpc.xlayer.tech` | 🟢 LIVE | ~930 ms |

> [!NOTE]
> CockroachDB Cloud and Amazon Bedrock are **co-located in AWS `us-east-1`** to minimize cross-service network latency during vector retrieval and synthesis.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

```bash
# 1. Clone Repository
git clone https://github.com/GreatSage-dev/Anamnesis.git
cd Anamnesis

# 2. Install Dependencies
npm install

# 3. Configure Environment (.env)
# DATABASE_URL=postgresql://Mrsage:wNcctJs_WNTKPDmcDtHaqw@anamnesis-32019.j77.aws-us-east-1.cockroachlabs.cloud:26257/defaultdb?sslmode=no-verify
# AWS_ACCESS_KEY_ID=AKIAXEOALYRZ7YC6VREL
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=us-east-1

# 4. Start Development Server (Express API :3000 + Vite Frontend :5173)
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** to launch the Anamnesis Dashboard & Live Demo!

---

## 📄 License & Hackathon Metadata

- **Event**: CockroachDB Cloud × AWS Hackathon
- **Track**: AI Agent Infrastructure & Security
- **Target Network**: OKX X Layer Testnet (Chain ID 1952)
- **License**: MIT

---

<div align="center">
  <sub>Built with ❤️ for CockroachDB Cloud × AWS Hackathon</sub>
</div>
