/**
 * Anamnesis API Routes
 * 
 * New Express routes for the Anamnesis memory layer.
 * These are registered alongside the existing Custos routes.
 * 
 * Routes:
 * - POST /api/anamnesis/evaluate — Full pipeline (signals → memory → Bedrock → store)
 * - GET  /api/anamnesis/decisions — Paginated audit trail
 * - GET  /api/anamnesis/stats     — Overview dashboard stats
 * - GET  /api/anamnesis/system    — Live service health
 * - GET  /api/anamnesis/dna/:address — Decision DNA for a counterparty
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { evaluateWithMemory } from '../services/anamnesisPipeline';
import { getDecisions, getStats, computeDecisionDNA } from '../services/anamnesisMemory';
import { testConnection } from '../db/client';
import { getVectorIndexStatus, getDecisionCount } from '../db/schema';
import { testBedrockConnection } from '../services/bedrockSynthesis';
import { CONFIG } from '../config';

export const anamnesisRouter = Router();

// ─── Evaluate (Full Anamnesis Pipeline) ─────────────────────────────

const evaluateSchema = z.object({
  provider_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid provider wallet address'),
  buyer_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid buyer wallet address'),
  service_price: z.number().positive('Service price must be positive'),
  service_category: z.string().min(1, 'Service category is required'),
  deadline: z.string().optional(),
});

anamnesisRouter.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const parseResult = evaluateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid input parameters',
        details: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    const result = await evaluateWithMemory(parseResult.data);
    return res.json(result);
  } catch (error: any) {
    console.error('[Anamnesis] Evaluation error:', error);
    return res.status(500).json({
      error: 'Anamnesis evaluation failed',
      message: error.message,
    });
  }
});

// ─── Decisions (Audit Trail) ────────────────────────────────────────

anamnesisRouter.get('/decisions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);

    const result = await getDecisions(page, perPage);
    return res.json({
      ...result,
      page,
      per_page: perPage,
    });
  } catch (error: any) {
    console.error('[Anamnesis] Decisions fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch decisions', message: error.message });
  }
});

// ─── Stats (Overview Dashboard) ─────────────────────────────────────

anamnesisRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    return res.json(stats);
  } catch (error: any) {
    console.error('[Anamnesis] Stats fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

// ─── System Health ──────────────────────────────────────────────────

anamnesisRouter.get('/system', async (_req: Request, res: Response) => {
  try {
    // Test all three services in parallel
    const [dbHealth, bedrockHealth, xlayerHealth] = await Promise.all([
      // CockroachDB
      (async () => {
        if (!CONFIG.DATABASE_URL) {
          const { total } = await getDecisions();
          return {
            connected: true,
            cluster_id: 'crdb-demo-local',
            total_decisions: total,
            vector_index_status: 'c-spann (active)',
            latency_ms: 1,
            mode: 'In-Memory Demo Engine',
          };
        }

        const conn = await testConnection();
        let totalDecisions = 0;
        let vectorIndexStatus = 'unknown';
        if (conn.connected) {
          try {
            totalDecisions = await getDecisionCount();
            vectorIndexStatus = await getVectorIndexStatus();
          } catch {}
        }
        return {
          connected: conn.connected,
          cluster_id: conn.cluster_id,
          total_decisions: totalDecisions,
          vector_index_status: vectorIndexStatus,
          latency_ms: conn.latency_ms,
        };
      })(),

      // Amazon Bedrock
      testBedrockConnection(),

      // X Layer RPC
      (async () => {
        const start = Date.now();
        try {
          const response = await fetch(CONFIG.XLAYER_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 1,
            }),
          });
          const data = await response.json() as any;
          return {
            connected: true,
            rpc_url: CONFIG.XLAYER_RPC_URL,
            current_block: parseInt(data.result, 16),
            chain_id: CONFIG.XLAYER_CHAIN_ID,
            latency_ms: Date.now() - start,
          };
        } catch (err: any) {
          return {
            connected: false,
            rpc_url: CONFIG.XLAYER_RPC_URL,
            chain_id: CONFIG.XLAYER_CHAIN_ID,
            latency_ms: Date.now() - start,
          };
        }
      })(),
    ]);

    return res.json({
      cockroachdb: dbHealth,
      bedrock: bedrockHealth,
      xlayer: xlayerHealth,
    });
  } catch (error: any) {
    console.error('[Anamnesis] System health error:', error);
    return res.status(500).json({ error: 'System health check failed', message: error.message });
  }
});

// ─── Decision DNA ───────────────────────────────────────────────────

anamnesisRouter.get('/dna/:address', async (req: Request, res: Response) => {
  try {
    const address = req.params.address;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // We need signals for DNA computation - use a lightweight default
    // In practice, the DNA is computed alongside an evaluation
    const dna = await computeDecisionDNA(address, {
      wallet_age_days: 0,
      total_tx_count: 0,
      total_volume_okb: 0,
      historical_avg_price_okb: 0,
      price_deviation_ratio: 1.0,
      wash_trading_detected: false,
      top_counterparties_ratio: 0,
      is_thin_history: true,
    });

    return res.json(dna);
  } catch (error: any) {
    console.error('[Anamnesis] DNA computation error:', error);
    return res.status(500).json({ error: 'DNA computation failed', message: error.message });
  }
});
