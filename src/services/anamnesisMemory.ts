/**
 * Anamnesis Memory Service
 * 
 * Provides persistent decision memory for Custos using CockroachDB.
 * Two retrieval paths:
 * 1. Exact match on LOWER(counterparty_address) for direct history
 * 2. C-SPANN vector L2 distance search (<->) on unit-normalized embeddings
 *    for semantically similar counterparty risk profiles
 * 
 * Includes an in-memory fallback store when CockroachDB is not connected.
 */

import { getPool } from '../db/client';
import {
  DecisionMemoryRecord,
  OnchainSignals,
  PaymentStructure,
  PrecedentQueryResult,
  RetrievedPrecedent,
  DecisionDNA,
} from '../types/anamnesis';
import {
  generateUnitEmbedding,
  buildEmbeddingInput,
} from './bedrockSynthesis';
import { CONFIG } from '../config';

// ─── In-Memory Fallback Store (Used when DATABASE_URL is not set) ────

const inMemoryStore: DecisionMemoryRecord[] = [];

// Seed sample historical precedent into in-memory store
function seedInMemoryStore() {
  if (inMemoryStore.length === 0) {
    inMemoryStore.push({
      id: '5f8a92b1-4c2e-4b8a-92f0-123456789abc',
      counterparty_address: '0x742d35cc6634c0532925a3b844bc9e7595f2bd18',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      onchain_signals: {
        wallet_age_days: 0,
        total_tx_count: 0,
        total_volume_okb: 0,
        historical_avg_price_okb: 0,
        price_deviation_ratio: 3.33,
        wash_trading_detected: false,
        top_counterparties_ratio: 0,
        is_thin_history: true,
      },
      verdict: 'caution',
      recommended_payment_structure: { type: 'split', split_ratio: '20/80' },
      reasoning_text: 'Provider wallet has thin on-chain history (0 recorded transactions on X Layer). Service price (50 OKB) significantly higher (>= 3.0x) than expected benchmark median (15 OKB). Split payment recommended.',
      cited_precedent_ids: [],
    });
  }
}
seedInMemoryStore();

// ─── Precedent Queries ──────────────────────────────────────────────

/**
 * Retrieves precedents via dual-path query:
 * (a) Exact address match using LOWER()
 * (b) Vector similarity search using C-SPANN accelerated L2 distance
 */
export async function queryPrecedents(
  counterpartyAddress: string,
  signalSummary: string
): Promise<PrecedentQueryResult> {
  const start = Date.now();

  // If CockroachDB is not configured, use in-memory store
  if (!CONFIG.DATABASE_URL) {
    const targetAddr = counterpartyAddress.toLowerCase();
    const exactMatches: RetrievedPrecedent[] = inMemoryStore
      .filter((rec) => rec.counterparty_address.toLowerCase() === targetAddr)
      .slice(0, 5)
      .map((rec) => ({
        id: rec.id,
        counterparty_address: rec.counterparty_address,
        created_at: rec.created_at,
        verdict: rec.verdict,
        reasoning_text: rec.reasoning_text,
        onchain_signals: rec.onchain_signals,
        recommended_payment_structure: rec.recommended_payment_structure,
        match_type: 'exact_address' as const,
      }));

    const similarMatches: RetrievedPrecedent[] = inMemoryStore
      .filter((rec) => rec.counterparty_address.toLowerCase() !== targetAddr)
      .slice(0, 3)
      .map((rec) => ({
        id: rec.id,
        counterparty_address: rec.counterparty_address,
        created_at: rec.created_at,
        verdict: rec.verdict,
        reasoning_text: rec.reasoning_text,
        onchain_signals: rec.onchain_signals,
        recommended_payment_structure: rec.recommended_payment_structure,
        match_type: 'vector_similarity' as const,
        distance: 0.142,
      }));

    return {
      exact_matches: exactMatches,
      similar_matches: similarMatches,
      total_found: exactMatches.length + similarMatches.length,
      query_latency_ms: Date.now() - start,
    };
  }

  // Live CockroachDB Query
  const pool = getPool();

  // Path A: Exact address match
  const exactResult = await pool.query(
    `SELECT id, counterparty_address, created_at, verdict, reasoning_text,
            onchain_signals, recommended_payment_structure, cited_precedent_ids
     FROM custos_decision_memory
     WHERE LOWER(counterparty_address) = LOWER($1)
     ORDER BY created_at DESC
     LIMIT 5`,
    [counterpartyAddress]
  );

  const exactMatches: RetrievedPrecedent[] = exactResult.rows.map((row: any) => ({
    id: row.id,
    counterparty_address: row.counterparty_address,
    created_at: row.created_at,
    verdict: row.verdict,
    reasoning_text: row.reasoning_text,
    onchain_signals: row.onchain_signals,
    recommended_payment_structure: row.recommended_payment_structure,
    match_type: 'exact_address' as const,
  }));

  // Path B: Vector similarity search
  let similarMatches: RetrievedPrecedent[] = [];
  try {
    const { vector } = await generateUnitEmbedding(signalSummary);
    const vectorStr = `[${vector.join(',')}]`;

    const vectorResult = await pool.query(
      `SELECT id, counterparty_address, created_at, verdict, reasoning_text,
              onchain_signals, recommended_payment_structure,
              (reasoning_vector <-> $1::VECTOR) as distance
       FROM custos_decision_memory
       WHERE reasoning_vector IS NOT NULL
       ORDER BY reasoning_vector <-> $1::VECTOR
       LIMIT 5`,
      [vectorStr]
    );

    similarMatches = vectorResult.rows
      .filter((row: any) => !exactMatches.some((em) => em.id === row.id))
      .map((row: any) => ({
        id: row.id,
        counterparty_address: row.counterparty_address,
        created_at: row.created_at,
        verdict: row.verdict,
        reasoning_text: row.reasoning_text,
        onchain_signals: row.onchain_signals,
        recommended_payment_structure: row.recommended_payment_structure,
        match_type: 'vector_similarity' as const,
        distance: parseFloat(row.distance),
      }));
  } catch (err: any) {
    console.warn('[Memory] Vector search failed (table may be empty):', err.message);
  }

  return {
    exact_matches: exactMatches,
    similar_matches: similarMatches,
    total_found: exactMatches.length + similarMatches.length,
    query_latency_ms: Date.now() - start,
  };
}

// ─── Decision Storage ───────────────────────────────────────────────

/**
 * Stores a new decision in CockroachDB with its unit-normalized embedding vector.
 */
export async function commitDecision(params: {
  counterpartyAddress: string;
  signals: OnchainSignals;
  verdict: string;
  paymentStructure: PaymentStructure;
  reasoningText: string;
  citedPrecedentIds: string[];
}): Promise<{ id: string; embedding_latency_ms: number }> {
  // If CockroachDB is not configured, store in-memory
  if (!CONFIG.DATABASE_URL) {
    const embeddingInput = buildEmbeddingInput(
      params.signals,
      params.verdict,
      params.reasoningText
    );
    const { vector, latency_ms } = await generateUnitEmbedding(embeddingInput);

    const record: DecisionMemoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      counterparty_address: params.counterpartyAddress.toLowerCase(),
      created_at: new Date().toISOString(),
      onchain_signals: params.signals,
      verdict: params.verdict.toLowerCase(),
      recommended_payment_structure: params.paymentStructure,
      reasoning_text: params.reasoningText,
      reasoning_vector: vector,
      cited_precedent_ids: params.citedPrecedentIds,
    };

    inMemoryStore.unshift(record);
    return { id: record.id, embedding_latency_ms: latency_ms };
  }

  // Live CockroachDB Commit
  const pool = getPool();
  const embeddingInput = buildEmbeddingInput(
    params.signals,
    params.verdict,
    params.reasoningText
  );
  const { vector, latency_ms: embeddingLatency } = await generateUnitEmbedding(embeddingInput);
  const vectorStr = `[${vector.join(',')}]`;

  const normalizedVerdict = params.verdict.toLowerCase() === 'approved' ? 'approve' : params.verdict.toLowerCase();

  const result = await pool.query(
    `INSERT INTO custos_decision_memory
     (counterparty_address, onchain_signals, verdict, recommended_payment_structure,
      reasoning_text, reasoning_vector, cited_precedent_ids)
     VALUES (LOWER($1), $2, $3, $4, $5, $6::VECTOR, $7)
     RETURNING id`,
    [
      params.counterpartyAddress,
      JSON.stringify(params.signals),
      normalizedVerdict,
      JSON.stringify(params.paymentStructure),
      params.reasoningText,
      vectorStr,
      params.citedPrecedentIds,
    ]
  );

  return {
    id: result.rows[0].id,
    embedding_latency_ms: embeddingLatency,
  };
}

// ─── Decision DNA ───────────────────────────────────────────────────

export async function computeDecisionDNA(
  counterpartyAddress: string,
  currentSignals: OnchainSignals
): Promise<DecisionDNA> {
  const targetAddr = counterpartyAddress.toLowerCase();
  let total = 0, approvals = 0, cautions = 0, denials = 0;

  if (!CONFIG.DATABASE_URL) {
    const history = inMemoryStore.filter(
      (rec) => rec.counterparty_address.toLowerCase() === targetAddr
    );
    total = history.length;
    approvals = history.filter((r) => r.verdict === 'approve').length;
    cautions = history.filter((r) => r.verdict === 'caution').length;
    denials = history.filter((r) => r.verdict === 'deny').length;
  } else {
    try {
      const pool = getPool();
      const historyResult = await pool.query(
        `SELECT
           COUNT(*)::int as total,
           COUNT(*) FILTER (WHERE verdict = 'approve')::int as approvals,
           COUNT(*) FILTER (WHERE verdict = 'caution')::int as cautions,
           COUNT(*) FILTER (WHERE verdict = 'deny')::int as denials
         FROM custos_decision_memory
         WHERE LOWER(counterparty_address) = LOWER($1)`,
        [counterpartyAddress]
      );
      const h = historyResult.rows[0] || { total: 0, approvals: 0, cautions: 0, denials: 0 };
      total = h.total; approvals = h.approvals; cautions = h.cautions; denials = h.denials;
    } catch {}
  }

  const walletAgeScore = Math.min(100, Math.round((currentSignals.wallet_age_days / 365) * 100));
  const txFrequencyScore = Math.min(100, Math.round((currentSignals.total_tx_count / 100) * 100));
  const paymentConsistencyScore = currentSignals.price_deviation_ratio <= 1.5
    ? Math.round(Math.max(0, 100 - (currentSignals.price_deviation_ratio - 1.0) * 100))
    : Math.round(Math.max(0, 100 - (currentSignals.price_deviation_ratio - 1.0) * 40));

  let riskScore = 0;
  if (currentSignals.wallet_age_days < 7) riskScore += 30;
  else if (currentSignals.wallet_age_days < 30) riskScore += 15;
  if (currentSignals.wash_trading_detected) riskScore += 40;
  if (currentSignals.is_thin_history) riskScore += 20;
  if (currentSignals.price_deviation_ratio >= 3.0) riskScore += 30;
  else if (currentSignals.price_deviation_ratio >= 2.0) riskScore += 15;
  riskScore += cautions * 5 + denials * 15;
  riskScore = Math.min(100, riskScore);

  return {
    counterparty_address: targetAddr,
    wallet_age_score: walletAgeScore,
    tx_frequency_score: txFrequencyScore,
    payment_consistency_score: paymentConsistencyScore,
    risk_score: riskScore,
    total_decisions: total,
    approvals,
    cautions,
    denials,
  };
}

// ─── Query Helpers ──────────────────────────────────────────────────

export async function getDecisions(
  page: number = 1,
  perPage: number = 20
): Promise<{ decisions: DecisionMemoryRecord[]; total: number }> {
  if (!CONFIG.DATABASE_URL) {
    const start = (page - 1) * perPage;
    return {
      decisions: inMemoryStore.slice(start, start + perPage),
      total: inMemoryStore.length,
    };
  }

  try {
    const pool = getPool();
    const offset = (page - 1) * perPage;
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, counterparty_address, created_at, onchain_signals, verdict,
                recommended_payment_structure, reasoning_text, cited_precedent_ids
         FROM custos_decision_memory
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [perPage, offset]
      ),
      pool.query('SELECT COUNT(*)::int as count FROM custos_decision_memory'),
    ]);

    return {
      decisions: dataResult.rows,
      total: countResult.rows[0]?.count || 0,
    };
  } catch (err: any) {
    console.warn('[Anamnesis Memory] getDecisions query failed, falling back to in-memory store:', err.message);
    const start = (page - 1) * perPage;
    return {
      decisions: inMemoryStore.slice(start, start + perPage),
      total: inMemoryStore.length,
    };
  }
}

export async function getStats(): Promise<{
  total_decisions: number;
  verdicts: { approve: number; caution: number; deny: number };
  unique_counterparties: number;
  recent_decisions: DecisionMemoryRecord[];
}> {
  if (!CONFIG.DATABASE_URL) {
    const total = inMemoryStore.length;
    const approvals = inMemoryStore.filter((r) => r.verdict === 'approve' || r.verdict === 'approved').length;
    const cautions = inMemoryStore.filter((r) => r.verdict === 'caution').length;
    const denials = inMemoryStore.filter((r) => r.verdict === 'deny').length;
    const uniqueAddrs = new Set(inMemoryStore.map((r) => r.counterparty_address.toLowerCase())).size;

    return {
      total_decisions: total,
      verdicts: { approve: approvals, caution: cautions, deny: denials },
      unique_counterparties: uniqueAddrs,
      recent_decisions: inMemoryStore.slice(0, 5),
    };
  }

  try {
    const pool = getPool();
    const [statsResult, recentResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE LOWER(verdict) IN ('approve', 'approved'))::int as approvals,
          COUNT(*) FILTER (WHERE LOWER(verdict) = 'caution')::int as cautions,
          COUNT(*) FILTER (WHERE LOWER(verdict) = 'deny')::int as denials,
          COUNT(DISTINCT LOWER(counterparty_address))::int as unique_counterparties
        FROM custos_decision_memory
      `),
      pool.query(`
        SELECT id, counterparty_address, created_at, onchain_signals, verdict,
               recommended_payment_structure, reasoning_text, cited_precedent_ids
        FROM custos_decision_memory
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ]);

    const stats = statsResult.rows[0];
    return {
      total_decisions: stats?.total || 0,
      verdicts: {
        approve: stats?.approvals || 0,
        caution: stats?.cautions || 0,
        deny: stats?.denials || 0,
      },
      unique_counterparties: stats?.unique_counterparties || 0,
      recent_decisions: recentResult.rows || [],
    };
  } catch (err: any) {
    console.warn('[Anamnesis Memory] getStats query failed, falling back to in-memory store:', err.message);
    const total = inMemoryStore.length;
    const approvals = inMemoryStore.filter((r) => r.verdict === 'approve' || r.verdict === 'approved').length;
    const cautions = inMemoryStore.filter((r) => r.verdict === 'caution').length;
    const denials = inMemoryStore.filter((r) => r.verdict === 'deny').length;
    const uniqueAddrs = new Set(inMemoryStore.map((r) => r.counterparty_address.toLowerCase())).size;

    return {
      total_decisions: total,
      verdicts: { approve: approvals, caution: cautions, deny: denials },
      unique_counterparties: uniqueAddrs,
      recent_decisions: inMemoryStore.slice(0, 5),
    };
  }
}
