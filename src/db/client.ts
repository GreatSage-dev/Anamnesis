/**
 * CockroachDB Cloud Connection Pool
 * 
 * Establishes a PostgreSQL-compatible connection to CockroachDB Cloud Serverless
 * using SSL. This pool is shared across all Anamnesis services.
 */

import { Pool, PoolConfig } from 'pg';
import { CONFIG } from '../config';

let pool: Pool | null = null;

/**
 * Returns a shared CockroachDB connection pool.
 * Creates the pool on first call, reuses on subsequent calls.
 */
export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = CONFIG.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not configured. Set it in .env to your CockroachDB Cloud connection string.'
      );
    }

    const poolConfig: PoolConfig = {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    pool = new Pool(poolConfig);

    pool.on('error', (err) => {
      console.error('[CockroachDB] Unexpected pool error:', err.message);
    });
  }

  return pool;
}

export function setPool(customPool: any): void {
  pool = customPool;
}

export function resetPool(): void {
  if (pool && typeof (pool as any).end === 'function') {
    (pool as any).end().catch(() => {});
  }
  pool = null;
}

/**
 * Tests the CockroachDB connection and returns cluster info.
 */
export async function testConnection(): Promise<{
  connected: boolean;
  cluster_id?: string;
  version?: string;
  latency_ms: number;
}> {
  const start = Date.now();
  try {
    const p = getPool();
    const result = await p.query(
      `SELECT current_database() as db_name, version() as version`
    );
    return {
      connected: true,
      cluster_id: result.rows[0]?.db_name || 'cockroachdb-cloud',
      version: result.rows[0]?.version,
      latency_ms: Date.now() - start,
    };
  } catch (err: any) {
    console.error('[CockroachDB] Connection test failed:', err.message);
    return {
      connected: false,
      latency_ms: Date.now() - start,
    };
  }
}

/**
 * Gracefully shuts down the connection pool.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
