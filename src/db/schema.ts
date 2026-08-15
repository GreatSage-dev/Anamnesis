/**
 * CockroachDB Schema Initialization
 * 
 * Creates the custos_decision_memory table with:
 * - VECTOR(1024) column for Titan v2 embeddings
 * - C-SPANN vector index (CockroachDB native, NOT pgvector HNSW)
 * - Counterparty address index for exact lookups
 */

import { getPool } from './client';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS custos_decision_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counterparty_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    onchain_signals JSONB NOT NULL,
    verdict VARCHAR(20) NOT NULL CHECK (verdict IN ('approve', 'caution', 'deny')),
    recommended_payment_structure JSONB NOT NULL,
    reasoning_text TEXT NOT NULL,
    reasoning_vector VECTOR(1024),
    cited_precedent_ids UUID[] DEFAULT '{}',
    INDEX idx_counterparty (counterparty_address)
);
`;

/**
 * CockroachDB native vector index using C-SPANN algorithm.
 * 
 * IMPORTANT: This is NOT pgvector's "CREATE INDEX ... USING hnsw".
 * CockroachDB uses its own syntax: CREATE VECTOR INDEX.
 * The underlying algorithm is C-SPANN, not HNSW.
 * Only vector_l2_ops (<-> operator) is currently accelerated.
 * We unit-normalize all vectors to make L2 distance equivalent to cosine ranking.
 */
const CREATE_VECTOR_INDEX_SQL = `
CREATE VECTOR INDEX IF NOT EXISTS idx_reasoning_vector
ON custos_decision_memory (reasoning_vector);
`;

/**
 * Initializes the CockroachDB schema.
 * Safe to call multiple times (uses IF NOT EXISTS).
 */
export async function initializeSchema(): Promise<{
  table_created: boolean;
  vector_index_created: boolean;
  vector_index_status: string;
}> {
  const pool = getPool();

  try {
    // Create table
    await pool.query(CREATE_TABLE_SQL);
    console.log('[Schema] custos_decision_memory table ready');

    // Create vector index
    try {
      await pool.query(CREATE_VECTOR_INDEX_SQL);
      console.log('[Schema] C-SPANN vector index ready');
    } catch (err: any) {
      // Vector index might already exist or feature flag might need enabling
      if (err.message.includes('already exists')) {
        console.log('[Schema] C-SPANN vector index already exists');
      } else {
        console.warn('[Schema] Vector index creation warning:', err.message);
        // Try enabling the feature flag
        try {
          await pool.query(`SET CLUSTER SETTING feature.vector_index.enabled = true`);
          await pool.query(CREATE_VECTOR_INDEX_SQL);
          console.log('[Schema] C-SPANN vector index created after enabling feature flag');
        } catch (retryErr: any) {
          console.warn('[Schema] Vector index retry warning:', retryErr.message);
        }
      }
    }

    // Check vector index status
    const indexStatus = await getVectorIndexStatus();

    return {
      table_created: true,
      vector_index_created: true,
      vector_index_status: indexStatus,
    };
  } catch (err: any) {
    console.error('[Schema] Initialization error:', err.message);
    throw err;
  }
}

/**
 * Queries the vector index status from CockroachDB system tables.
 */
export async function getVectorIndexStatus(): Promise<string> {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT index_name, index_type 
      FROM [SHOW INDEXES FROM custos_decision_memory] 
      WHERE index_name = 'idx_reasoning_vector'
    `);
    if (result.rows.length > 0) {
      return `active (${result.rows[0].index_type || 'vector'})`;
    }
    return 'not found';
  } catch {
    return 'unknown';
  }
}

/**
 * Returns the total number of decision records.
 */
export async function getDecisionCount(): Promise<number> {
  const pool = getPool();
  const result = await pool.query('SELECT COUNT(*)::int as count FROM custos_decision_memory');
  return result.rows[0]?.count || 0;
}
