import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DecisionDNA from '../components/DecisionDNA';

interface Stats {
  total_decisions: number;
  verdicts: { approve: number; caution: number; deny: number };
  unique_counterparties: number;
  recent_decisions: any[];
}

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/anamnesis/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="anamnesis-page">
        <div className="empty-state"><span className="loading-spinner" /> Loading Intelligence Engine...</div>
      </div>
    );
  }

  const s = stats || { total_decisions: 0, verdicts: { approve: 0, caution: 0, deny: 0 }, unique_counterparties: 0, recent_decisions: [] };
  const total = s.total_decisions || 1;
  const approvePct = Math.round((s.verdicts.approve / total) * 100);
  const cautionPct = Math.round((s.verdicts.caution / total) * 100);

  return (
    <div className="anamnesis-page">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Anamnesis decision memory — real-time precedent intelligence from CockroachDB Cloud</p>
      </div>

      {/* ── Live Infrastructure Banner ─────────────────────────── */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)' }}>
              <span className="status-dot connected" /> CockroachDB Cloud
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>C-SPANN Vector Index (1024-dim)</span>
            <span style={{ color: 'var(--text-tertiary)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Amazon Bedrock Titan v2 + Claude Sonnet 4.5</span>
          </div>
          <span className="landing-hero-badge" style={{ margin: 0, fontSize: 10, padding: '3px 10px' }}>
            🟢 FAIL-OPEN RESILIENT
          </span>
        </div>
      </div>

      {/* ── Stat Cards Grid ────────────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Decisions</div>
          <div className="stat-value">{s.total_decisions}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            ✦ Synchronous Cloud Sync
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value approve">{s.verdicts.approve}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{ width: `${approvePct}%`, height: '100%', background: 'var(--verdict-approve)' }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{approvePct}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Caution / Escrow</div>
          <div className="stat-value caution">{s.verdicts.caution}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{ width: `${cautionPct}%`, height: '100%', background: 'var(--verdict-caution)' }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{cautionPct}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Unique Counterparties</div>
          <div className="stat-value">{s.unique_counterparties}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            {(s.total_decisions / (s.unique_counterparties || 1)).toFixed(1)} avg checks / wallet
          </div>
        </div>
      </div>

      {/* ── Most Recent Decision Spotlight ────────────────────── */}
      {s.recent_decisions.length > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="card-title">Most Recent Counterparty Fingerprint</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'var(--accent-muted)', padding: '2px 8px', borderRadius: 10 }}>
                LATEST RECALL
              </span>
            </div>
            <span className="verdict-badge" style={{
              textTransform: 'uppercase',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 11,
              ...(s.recent_decisions[0].verdict === 'approve' || s.recent_decisions[0].verdict === 'approved'
                ? { color: 'var(--verdict-approve)', background: 'var(--verdict-approve-muted)' }
                : s.recent_decisions[0].verdict === 'caution'
                ? { color: 'var(--verdict-caution)', background: 'var(--verdict-caution-muted)' }
                : { color: 'var(--verdict-deny)', background: 'var(--verdict-deny-muted)' }),
            }}>
              {s.recent_decisions[0].verdict}
            </span>
          </div>

          <DecisionDNA
            address={s.recent_decisions[0].counterparty_address}
            walletAgeScore={Math.min(100, Math.round(((s.recent_decisions[0].onchain_signals?.wallet_age_days || 0) / 365) * 100))}
            txFrequencyScore={Math.min(100, Math.round(((s.recent_decisions[0].onchain_signals?.total_tx_count || 0) / 100) * 100))}
            paymentConsistencyScore={Math.round(Math.max(0, 100 - ((s.recent_decisions[0].onchain_signals?.price_deviation_ratio || 1) - 1) * 40))}
            riskScore={s.recent_decisions[0].onchain_signals?.wash_trading_detected ? 65 : s.recent_decisions[0].onchain_signals?.is_thin_history ? 35 : 15}
            totalDecisions={s.total_decisions}
            approvals={s.verdicts.approve}
            cautions={s.verdicts.caution}
            denials={s.verdicts.deny}
          />

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <div className="demo-result-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span>Synthesized Reasoning (AWS Bedrock + Precedent Memory)</span>
              {s.recent_decisions[0].cited_precedent_ids?.length > 0 && (
                <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  ✦ Citing Precedent #{s.recent_decisions[0].cited_precedent_ids[0].slice(0, 8)}
                </span>
              )}
            </div>
            <div className="demo-result-value" style={{ fontSize: 12, lineHeight: 1.7, background: 'var(--bg-elevated)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
              {s.recent_decisions[0].reasoning_text}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Precedent Memory Stream (Sleek Compact Stream) ──── */}
      {s.recent_decisions.length > 1 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="card-title">Recent Memory Stream</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                LIVE COCKROACHDB LOG
              </span>
            </div>
            <Link to="/dashboard/audit" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              View Audit Trail ({s.total_decisions}) →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.recent_decisions.slice(1, 5).map((rec: any, idx: number) => (
              <div key={rec.id || idx} style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                boxShadow: 'var(--shadow-neu-in)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                fontSize: 12,
                transition: 'all 0.2s ease'
              }}>
                {/* Left: Counterparty & Verdict */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>
                    {rec.counterparty_address?.slice(0, 6)}...{rec.counterparty_address?.slice(-4)}
                  </span>
                  <span className="verdict-badge" style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: 6,
                    ...(rec.verdict === 'approve' || rec.verdict === 'approved'
                      ? { color: 'var(--verdict-approve)', background: 'var(--verdict-approve-muted)' }
                      : rec.verdict === 'caution'
                      ? { color: 'var(--verdict-caution)', background: 'var(--verdict-caution-muted)' }
                      : { color: 'var(--verdict-deny)', background: 'var(--verdict-deny-muted)' }),
                  }}>
                    {rec.verdict}
                  </span>
                </div>

                {/* Center: Truncated Reasoning Snippet */}
                <div style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rec.reasoning_text}
                </div>

                {/* Right: Precedent ID & Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {rec.cited_precedent_ids?.length > 0 ? (
                    <span style={{ color: 'var(--accent)', background: 'var(--accent-muted)', padding: '2px 6px', borderRadius: 4 }}>
                      ✦ #{rec.cited_precedent_ids[0].slice(0, 6)}
                    </span>
                  ) : (
                    <span style={{ opacity: 0.6 }}>First Check</span>
                  )}
                  <span>{new Date(rec.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {s.recent_decisions.length === 0 && (
        <div className="card">
          <div className="empty-state">
            No decisions recorded yet. Go to <strong>Live Demo</strong> to execute your first two-pass evaluation.
          </div>
        </div>
      )}
    </div>
  );
}

