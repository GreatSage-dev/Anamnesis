import React, { useState } from 'react';
import DecisionDNA from '../components/DecisionDNA';

/**
 * Live Demo Page — The hackathon money shot.
 * Two-pass evaluation runner with side-by-side comparison.
 */

interface EvalResult {
  deterministic: any;
  precedents: any;
  synthesis: any;
  stored_decision_id: string;
  pipeline: any;
  aws_bedrock: any;
}

export default function LiveDemoPage() {
  const [providerWallet, setProviderWallet] = useState('0x9999999999999999999999999999999999999999');
  const [buyerWallet, setBuyerWallet] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
  const [servicePrice, setServicePrice] = useState('50');
  const [serviceCategory, setServiceCategory] = useState('trading_signal');
  const [pass1, setPass1] = useState<EvalResult | null>(null);
  const [pass2, setPass2] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'pass1' | 'pass1done' | 'pass2' | 'complete'>('idle');

  const runEvaluation = async () => {
    const body = {
      provider_wallet: providerWallet,
      buyer_wallet: buyerWallet,
      service_price: parseFloat(servicePrice),
      service_category: serviceCategory,
    };

    const res = await fetch('/api/anamnesis/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<EvalResult>;
  };

  const handlePass1 = async () => {
    setLoading(true);
    setPhase('pass1');
    try {
      const result = await runEvaluation();
      setPass1(result);
      setPhase('pass1done');
    } catch (err: any) {
      alert('Evaluation failed: ' + err.message);
      setPhase('idle');
    }
    setLoading(false);
  };

  const handlePass2 = async () => {
    setLoading(true);
    setPhase('pass2');
    try {
      const result = await runEvaluation();
      setPass2(result);
      setPhase('complete');
    } catch (err: any) {
      alert('Re-evaluation failed: ' + err.message);
      setPhase('pass1done');
    }
    setLoading(false);
  };

  const handleReset = () => {
    setPass1(null);
    setPass2(null);
    setPhase('idle');
  };

  const formatVerdict = (v: string) => v?.toUpperCase() || '—';

  return (
    <div className="anamnesis-page">
      <div className="page-header">
        <h1 className="page-title">Live Demo</h1>
        <p className="page-subtitle">
          Two-pass evaluation: see how memory shapes the verdict in real time
        </p>
      </div>

      {/* Input Form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Evaluation Parameters</span>
          {phase !== 'idle' && (
            <button className="btn btn-secondary" onClick={handleReset} style={{ padding: '6px 14px', fontSize: 12 }}>
              Reset
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">Provider Wallet</label>
              {phase === 'idle' && (
                <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
                  <button
                    type="button"
                    onClick={() => setProviderWallet('0x9999999999999999999999999999999999999999')}
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: 'none', padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                  >
                    Demo #1
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderWallet('0x742d35cc6634c0532925a3b844bc9e7595f2bd18')}
                    style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: 'none', padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                  >
                    Demo #2
                  </button>
                </div>
              )}
            </div>
            <input
              className="input-field"
              placeholder="0x..."
              value={providerWallet}
              onChange={(e) => setProviderWallet(e.target.value)}
              disabled={phase !== 'idle'}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Buyer Wallet</label>
            <input
              className="input-field"
              placeholder="0x..."
              value={buyerWallet}
              onChange={(e) => setBuyerWallet(e.target.value)}
              disabled={phase !== 'idle'}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Service Price (OKB)</label>
            <input
              className="input-field"
              type="number"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              disabled={phase !== 'idle'}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select
              className="input-field"
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              disabled={phase !== 'idle'}
            >
              <option value="trading_signal">Trading Signal</option>
              <option value="audit">Audit</option>
              <option value="code_generation">Code Generation</option>
              <option value="data_feed">Data Feed</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          {phase === 'idle' && (
            <button
              className="btn btn-primary"
              onClick={handlePass1}
              disabled={!providerWallet || loading}
            >
              {loading ? <span className="loading-spinner" /> : null}
              Evaluate (Pass 1)
            </button>
          )}
          {phase === 'pass1done' && (
            <button
              className="btn btn-primary"
              onClick={handlePass2}
              disabled={loading}
            >
              {loading ? <span className="loading-spinner" /> : null}
              Re-evaluate (Pass 2 — With Memory)
            </button>
          )}
        </div>
      </div>

      {/* Side-by-side Results */}
      {(pass1 || pass2) && (
        <div className="demo-panels">
          {/* Pass 1 */}
          <div className="demo-panel">
            <div className="demo-panel-label">
              <span className="pass-num">1</span>
              First Evaluation — No Memory
            </div>

            {pass1 && (
              <>
                <div className="demo-result-section">
                  <div className="demo-result-label">Deterministic Base</div>
                  <span className={`verdict-badge ${pass1.deterministic.verdict.toLowerCase()}`} style={{ textTransform: 'uppercase' }}>
                    {pass1.deterministic.verdict}
                  </span>
                </div>

                <div className="demo-result-section">
                  <div className="demo-result-label">Precedents Found</div>
                  <div className="demo-result-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {pass1.precedents.total_found === 0
                      ? 'None — first evaluation for this counterparty'
                      : `${pass1.precedents.exact_matches.length} exact, ${pass1.precedents.similar_matches.length} similar`}
                  </div>
                </div>

                <div className="demo-result-section">
                  <div className="demo-result-label">Bedrock Synthesis Verdict</div>
                  <span className={`verdict-badge ${pass1.synthesis.final_verdict}`}>
                    {formatVerdict(pass1.synthesis.final_verdict)}
                  </span>
                </div>

                <div className="demo-result-section">
                  <div className="demo-result-label">Reasoning</div>
                  <div className="demo-result-value" style={{ fontSize: 12, lineHeight: 1.7 }}>
                    {pass1.synthesis.reasoning}
                  </div>
                </div>

                <div className="demo-result-section">
                  <div className="demo-result-label">Stored Decision ID</div>
                  <div className="demo-result-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                    {pass1.stored_decision_id}
                  </div>
                </div>

                {/* Pipeline timing */}
                <div className="demo-result-section">
                  <div className="demo-result-label">Pipeline ({pass1.pipeline.total_latency_ms}ms)</div>
                  <div className="pipeline-bar">
                    <div className="pipeline-segment xlayer" style={{ flex: pass1.pipeline.xlayer_latency_ms }} />
                    <div className="pipeline-segment memory" style={{ flex: pass1.pipeline.memory_query_latency_ms }} />
                    <div className="pipeline-segment embedding" style={{ flex: pass1.pipeline.bedrock_embedding_latency_ms }} />
                    <div className="pipeline-segment synthesis" style={{ flex: pass1.pipeline.bedrock_synthesis_latency_ms }} />
                  </div>
                  <div className="pipeline-legend">
                    <div className="pipeline-legend-item"><div className="pipeline-legend-dot" style={{ background: 'var(--accent)' }} /> X Layer {pass1.pipeline.xlayer_latency_ms}ms</div>
                    <div className="pipeline-legend-item"><div className="pipeline-legend-dot" style={{ background: 'var(--verdict-approve)' }} /> Memory {pass1.pipeline.memory_query_latency_ms}ms</div>
                    <div className="pipeline-legend-item"><div className="pipeline-legend-dot" style={{ background: 'var(--verdict-caution)' }} /> Embed {pass1.pipeline.bedrock_embedding_latency_ms}ms</div>
                    <div className="pipeline-legend-item"><div className="pipeline-legend-dot" style={{ background: '#A78BFA' }} /> Synth {pass1.pipeline.bedrock_synthesis_latency_ms}ms</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pass 2 */}
          <div className="demo-panel" style={{ opacity: pass2 ? 1 : 0.3 }}>
            <div className="demo-panel-label">
              <span className="pass-num">2</span>
              Re-evaluation — With Memory
            </div>

            {phase === 'pass2' && (
              <div className="empty-state"><span className="loading-spinner" /> Querying CockroachDB memory + Bedrock synthesis...</div>
            )}

            {pass2 && (
              <>
                <div className="demo-result-section">
                  <div className="demo-result-label">Deterministic Base</div>
                  <span className={`verdict-badge ${pass2.deterministic.verdict.toLowerCase()}`} style={{ textTransform: 'uppercase' }}>
                    {pass2.deterministic.verdict}
                  </span>
                </div>

                <div className="demo-result-section">
                  <div className="demo-result-label">Precedents Found</div>
                  <div className="demo-precedent-found">
                    ✦ {pass2.precedents.exact_matches.length} exact match{pass2.precedents.exact_matches.length !== 1 ? 'es' : ''}
                    {pass2.precedents.similar_matches.length > 0 && `, ${pass2.precedents.similar_matches.length} vector similar`}
                    {' '}— retrieved in {pass2.precedents.query_latency_ms}ms
                  </div>
                </div>

                <div className="demo-result-section">
                  <div className="demo-result-label">Bedrock Synthesis Verdict</div>
                  <span className={`verdict-badge ${pass2.synthesis.final_verdict}`}>
                    {formatVerdict(pass2.synthesis.final_verdict)}
                  </span>
                </div>

                {/* Verdict Shift Highlight */}
                {pass2.synthesis.verdict_shifted && (
                  <div className="verdict-shift">
                    <strong>Verdict shifted</strong> from {formatVerdict(pass1?.synthesis.final_verdict || '')} → {formatVerdict(pass2.synthesis.final_verdict)}
                    {pass2.synthesis.shift_explanation && (
                      <div style={{ marginTop: 8, fontSize: 12 }}>{pass2.synthesis.shift_explanation}</div>
                    )}
                  </div>
                )}

                <div className="demo-result-section">
                  <div className="demo-result-label">Reasoning (with cited precedents)</div>
                  <div className="demo-result-value" style={{ fontSize: 12, lineHeight: 1.7 }}>
                    {pass2.synthesis.reasoning}
                  </div>
                </div>

                {pass2.synthesis.cited_precedent_ids?.length > 0 && (
                  <div className="demo-result-section">
                    <div className="demo-result-label">Cited Precedent IDs</div>
                    <div className="demo-result-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                      {pass2.synthesis.cited_precedent_ids.join(', ')}
                    </div>
                  </div>
                )}

                <div className="demo-result-section">
                  <div className="demo-result-label">Pipeline ({pass2.pipeline.total_latency_ms}ms)</div>
                  <div className="pipeline-bar">
                    <div className="pipeline-segment xlayer" style={{ flex: pass2.pipeline.xlayer_latency_ms }} />
                    <div className="pipeline-segment memory" style={{ flex: pass2.pipeline.memory_query_latency_ms }} />
                    <div className="pipeline-segment embedding" style={{ flex: pass2.pipeline.bedrock_embedding_latency_ms }} />
                    <div className="pipeline-segment synthesis" style={{ flex: pass2.pipeline.bedrock_synthesis_latency_ms }} />
                  </div>
                  <div className="pipeline-legend">
                    <div className="pipeline-legend-item"><div className="pipeline-legend-dot" style={{ background: 'var(--accent)' }} /> X Layer {pass2.pipeline.xlayer_latency_ms}ms</div>
                    <div className="pipeline-legend-item"><div className="pipeline-legend-dot" style={{ background: 'var(--verdict-approve)' }} /> Memory {pass2.pipeline.memory_query_latency_ms}ms</div>
                    <div className="pipeline-legend-item"><div className="pipeline-legend-dot" style={{ background: 'var(--verdict-caution)' }} /> Embed {pass2.pipeline.bedrock_embedding_latency_ms}ms</div>
                    <div className="pipeline-legend-item"><div className="pipeline-legend-dot" style={{ background: '#A78BFA' }} /> Synth {pass2.pipeline.bedrock_synthesis_latency_ms}ms</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
