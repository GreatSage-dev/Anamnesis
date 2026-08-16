import React from 'react';
import { Link } from 'react-router-dom';
import ArcBackground from '../components/ArcBackground';
import DecisionDNA from '../components/DecisionDNA';
import AnamnesisLogo from '../components/AnamnesisLogo';

export default function AnamnesisLandingPage() {
  return (
    <div className="landing-root">
      <ArcBackground />

      {/* ── Sticky Nav ──────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <AnamnesisLogo size={32} showOrb={true} />
            <span>Anamnesis</span>
          </div>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
            Enter Dashboard →
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="landing-hero-section">
        <div className="landing-hero-badge">
          ✦ CockroachDB × AWS Hackathon • Decision Memory for AI Agents
        </div>

        <h1 className="landing-hero-title">
          Memory That Shapes<br />
          <span className="landing-hero-fade">Every Verdict</span>
        </h1>

        <p className="landing-hero-sub">
          Anamnesis gives Custos (OKX.AI Agent 7327) persistent, searchable decision memory — 
          so repeat fraud, near-miss wash trading, and multi-session behavioral patterns 
          are caught by precedent, not just single-snapshot thresholds.
        </p>

        <div className="landing-hero-actions">
          <Link to="/dashboard/demo" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 14 }}>
            Run Live Demo →
          </Link>
          <a href="#architecture" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: 14 }}>
            How It Works ↓
          </a>
        </div>
      </section>

      {/* ── Decision DNA Preview ────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-label">LIVE MEMORY FINGERPRINT</div>
          <div className="card" style={{ padding: 32 }}>
            <div className="card-header" style={{ marginBottom: 24 }}>
              <span className="card-title">Decision DNA — Behavioral Profile</span>
              <span className="verdict-badge caution">CAUTION • PRECEDENT CITED</span>
            </div>

            <DecisionDNA
              address="0x71A92F4B892c90F142D746b1A92801A9492F0123"
              walletAgeScore={92}
              txFrequencyScore={64}
              paymentConsistencyScore={78}
              riskScore={45}
              totalDecisions={12}
              approvals={8}
              cautions={3}
              denials={1}
            />

            <div className="landing-precedent-box">
              <div className="demo-result-label" style={{ marginBottom: 6 }}>Retrieved Precedent Synthesis</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                "Precedent <code style={{ color: 'var(--accent)', background: 'var(--accent-muted)', padding: '1px 6px', borderRadius: 3, fontSize: 12 }}>#5f8a92b1</code> retrieved via CockroachDB C-SPANN vector search (L2 distance: 0.142). 
                While single-session entropy threshold was barely met, 3 past evaluations over 14 days confirm a systematic volume-splitting pattern. 
                Verdict upgraded to <strong style={{ color: 'var(--verdict-caution)' }}>CAUTION — Escrow Required</strong>."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="landing-section" id="architecture">
        <div className="landing-container">
          <div className="landing-section-label">HOW IT WORKS</div>
          <h2 className="landing-section-title">Four-stage evaluation pipeline</h2>
          <p className="landing-section-desc">
            Every verdict passes through deterministic signal analysis, CockroachDB memory retrieval, 
            Amazon Bedrock synthesis, and persistent storage — in a single API call.
          </p>

          <div className="landing-flow-grid">
            <div className="landing-flow-card">
              <div className="landing-flow-num">1</div>
              <h3 className="landing-flow-card-title">Evaluate</h3>
              <p className="landing-flow-card-desc">
                Custos computes wallet age, price deviation ratio, wash-trade entropy, and sybil patterns 
                from live X Layer on-chain data. 100% deterministic — same inputs, same outputs.
              </p>
            </div>

            <div className="landing-flow-card">
              <div className="landing-flow-num">2</div>
              <h3 className="landing-flow-card-title">Remember</h3>
              <p className="landing-flow-card-desc">
                CockroachDB dual-path query: exact LOWER(address) match for direct history, 
                plus C-SPANN vector L2 search for semantically similar counterparty risk profiles.
              </p>
            </div>

            <div className="landing-flow-card">
              <div className="landing-flow-num">3</div>
              <h3 className="landing-flow-card-title">Synthesize</h3>
              <p className="landing-flow-card-desc">
                Amazon Bedrock weighs current signals against retrieved precedents. 
                Anti-echo-chamber prompting ensures past verdicts inform but don't dictate.
              </p>
            </div>

            <div className="landing-flow-card">
              <div className="landing-flow-num">4</div>
              <h3 className="landing-flow-card-title">Store</h3>
              <p className="landing-flow-card-desc">
                Decision, reasoning, signals, and Titan v2 unit-normalized 1024-dim embedding 
                are committed to CockroachDB for future precedent retrieval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture ────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-label">ARCHITECTURE</div>
          <h2 className="landing-section-title">Three services, one verdict</h2>

          <div className="landing-arch-grid">
            <div className="card landing-arch-card">
              <div className="landing-arch-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
                </svg>
              </div>
              <h3 className="landing-arch-title">CockroachDB Cloud</h3>
              <p className="landing-arch-desc">
                C-SPANN vector index for semantic similarity. Exact address matching via LOWER(). 
                Distributed, transactional, zero-downtime decision storage.
              </p>
              <div className="landing-arch-tag">Vector Index + Relational</div>
            </div>

            <div className="card landing-arch-card">
              <div className="landing-arch-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3 className="landing-arch-title">Amazon Bedrock</h3>
              <p className="landing-arch-desc">
                Titan Text Embeddings v2 (1024-dim, unit-normalized). Claude Sonnet 4.5 / Nova 
                for precedent-informed verdict synthesis with cited reasoning.
              </p>
              <div className="landing-arch-tag">Embeddings + Reasoning</div>
            </div>

            <div className="card landing-arch-card">
              <div className="landing-arch-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="landing-arch-title">Custos Agent 7327</h3>
              <p className="landing-arch-desc">
                Deterministic pre-payment engine on OKX X Layer. Wallet age, price deviation, 
                wash-trade entropy — untouched baseline, memory layered on top.
              </p>
              <div className="landing-arch-tag">X Layer On-Chain Signals</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="landing-section" style={{ paddingBottom: 120 }}>
        <div className="landing-container" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 className="landing-section-title" style={{ marginBottom: 16 }}>See it live</h2>
          <p className="landing-section-desc" style={{ marginBottom: 40, textAlign: 'center', margin: '0 auto 40px' }}>
            Run two evaluations on the same wallet. Watch the second pass retrieve the first as a precedent 
            from CockroachDB and shift the verdict in real time.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to="/dashboard/demo" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: 15 }}>
              Enter Live Demo →
            </Link>
            <Link to="/dashboard/system" className="btn btn-secondary" style={{ padding: '14px 36px', fontSize: 15 }}>
              View Infrastructure
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-inner">
            <span className="landing-footer-brand">Anamnesis</span>
            <span className="landing-footer-sub">CockroachDB × AWS Hackathon 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
