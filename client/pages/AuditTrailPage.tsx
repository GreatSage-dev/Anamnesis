import React, { useEffect, useState } from 'react';

/**
 * Audit Trail Page — Raw CockroachDB decision records.
 * Table with expandable rows showing full reasoning and precedent citations.
 */

interface Decision {
  id: string;
  counterparty_address: string;
  created_at: string;
  verdict: string;
  reasoning_text: string;
  onchain_signals: any;
  recommended_payment_structure: any;
  cited_precedent_ids: string[];
}

export default function AuditTrailPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchDecisions = () => {
    setLoading(true);
    fetch(`/api/anamnesis/decisions?page=${page}&per_page=15`)
      .then((r) => r.json())
      .then((data) => {
        setDecisions(data.decisions || []);
        setTotal(data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDecisions(); }, [page]);

  const shortAddr = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—';

  const shortId = (id: string) =>
    id ? id.slice(0, 8) + '...' : '—';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  return (
    <div className="anamnesis-page">
      <div className="page-header">
        <h1 className="page-title">Audit Trail</h1>
        <p className="page-subtitle">
          Every decision record stored in CockroachDB — {total} total
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><span className="loading-spinner" /> Loading decisions...</div>
        ) : decisions.length === 0 ? (
          <div className="empty-state">No decisions recorded yet.</div>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Counterparty</th>
                <th>Verdict</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Precedents</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <React.Fragment key={d.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="mono">{shortId(d.id)}</td>
                    <td className="address">{shortAddr(d.counterparty_address)}</td>
                    <td>
                      <span className={`verdict-badge ${d.verdict}`}>
                        {d.verdict.toUpperCase()}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {d.recommended_payment_structure?.type || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {formatDate(d.created_at)}
                    </td>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {d.cited_precedent_ids?.length > 0
                        ? `${d.cited_precedent_ids.length} cited`
                        : '—'}
                    </td>
                  </tr>
                  {expandedId === d.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: '0 12px 12px' }}>
                        <div className="expandable-content">
                          <div style={{ marginBottom: 12 }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                              Full Reasoning
                            </strong>
                            <p style={{ marginTop: 6, lineHeight: 1.7, fontSize: 13 }}>
                              {d.reasoning_text}
                            </p>
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                              On-Chain Signals
                            </strong>
                            <pre style={{
                              marginTop: 6,
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              whiteSpace: 'pre-wrap',
                            }}>
                              {JSON.stringify(d.onchain_signals, null, 2)}
                            </pre>
                          </div>

                          {d.cited_precedent_ids?.length > 0 && (
                            <div>
                              <strong style={{ color: 'var(--text-primary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                Cited Precedent IDs
                              </strong>
                              <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                                {d.cited_precedent_ids.join('\n')}
                              </div>
                            </div>
                          )}

                          <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                            Full ID: {d.id} | Address: {d.counterparty_address}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{ padding: '6px 16px', fontSize: 12 }}
          >
            Previous
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>
            Page {page} of {Math.ceil(total / 15)}
          </span>
          <button
            className="btn btn-secondary"
            disabled={page * 15 >= total}
            onClick={() => setPage(page + 1)}
            style={{ padding: '6px 16px', fontSize: 12 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
