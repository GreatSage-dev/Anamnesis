import React, { useEffect, useState } from 'react';

/**
 * System Page — Live infrastructure status dashboard.
 * Shows real connection proof for CockroachDB, Amazon Bedrock, and X Layer RPC.
 */

interface SystemData {
  cockroachdb: {
    connected: boolean;
    cluster_id?: string;
    total_decisions: number;
    vector_index_status: string;
    latency_ms: number;
  };
  bedrock: {
    connected: boolean;
    embedding_model: string;
    synthesis_model: string;
    region: string;
    latency_ms: number;
  };
  xlayer: {
    connected: boolean;
    rpc_url: string;
    current_block?: number;
    chain_id: number;
    latency_ms: number;
  };
}

export default function SystemPage() {
  const [system, setSystem] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchSystem = () => {
    setLoading(true);
    fetch('/api/anamnesis/system')
      .then((r) => r.json())
      .then((data) => {
        setSystem(data);
        setLastRefresh(new Date());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSystem(); }, []);

  const maskSecret = (s: string) => {
    if (!s) return '—';
    if (s.length <= 8) return '●●●●●●●●';
    return s.slice(0, 4) + '●●●●' + s.slice(-4);
  };

  return (
    <div className="anamnesis-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">System</h1>
          <p className="page-subtitle">Live infrastructure health — CockroachDB, Amazon Bedrock, X Layer</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSystem} disabled={loading} style={{ padding: '6px 16px', fontSize: 12 }}>
          {loading ? <span className="loading-spinner" /> : '↻'} Refresh
        </button>
      </div>

      {loading && !system ? (
        <div className="empty-state"><span className="loading-spinner" /> Checking services...</div>
      ) : system ? (
        <>
          <div className="system-grid">
            {/* CockroachDB */}
            <div className="system-card">
              <div className="system-card-header">
                <span className={`status-dot ${system.cockroachdb.connected ? 'connected' : 'disconnected'}`} />
                <span className="system-card-title">CockroachDB Cloud</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Status</span>
                <span className="system-detail-value" style={{ color: system.cockroachdb.connected ? 'var(--verdict-approve)' : 'var(--verdict-deny)' }}>
                  {system.cockroachdb.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Cluster ID</span>
                <span className="system-detail-value">{maskSecret(system.cockroachdb.cluster_id || '')}</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Total Decisions</span>
                <span className="system-detail-value">{system.cockroachdb.total_decisions}</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Vector Index</span>
                <span className="system-detail-value">{system.cockroachdb.vector_index_status}</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Latency</span>
                <span className="system-detail-value">{system.cockroachdb.latency_ms}ms</span>
              </div>
            </div>

            {/* Amazon Bedrock */}
            <div className="system-card">
              <div className="system-card-header">
                <span className={`status-dot ${system.bedrock.connected ? 'connected' : 'disconnected'}`} />
                <span className="system-card-title">Amazon Bedrock</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Status</span>
                <span className="system-detail-value" style={{ color: system.bedrock.connected ? 'var(--verdict-approve)' : 'var(--verdict-deny)' }}>
                  {system.bedrock.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Embedding Model</span>
                <span className="system-detail-value" style={{ fontSize: 10 }}>{system.bedrock.embedding_model}</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Synthesis Model</span>
                <span className="system-detail-value" style={{ fontSize: 10 }}>{system.bedrock.synthesis_model}</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Region</span>
                <span className="system-detail-value">{system.bedrock.region}</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Latency</span>
                <span className="system-detail-value">{system.bedrock.latency_ms}ms</span>
              </div>
            </div>

            {/* X Layer RPC */}
            <div className="system-card">
              <div className="system-card-header">
                <span className={`status-dot ${system.xlayer.connected ? 'connected' : 'disconnected'}`} />
                <span className="system-card-title">OKX X Layer</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Status</span>
                <span className="system-detail-value" style={{ color: system.xlayer.connected ? 'var(--verdict-approve)' : 'var(--verdict-deny)' }}>
                  {system.xlayer.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">RPC URL</span>
                <span className="system-detail-value" style={{ fontSize: 10 }}>{system.xlayer.rpc_url}</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Current Block</span>
                <span className="system-detail-value">
                  {system.xlayer.current_block ? `#${system.xlayer.current_block.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Chain ID</span>
                <span className="system-detail-value">{system.xlayer.chain_id}</span>
              </div>
              <div className="system-detail">
                <span className="system-detail-label">Latency</span>
                <span className="system-detail-value">{system.xlayer.latency_ms}ms</span>
              </div>
            </div>
          </div>

          {lastRefresh && (
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
              Last checked: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
