import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { CONFIG } from '../src/config';
import { DecisionEngine } from '../src/services/decisionEngine';
import { anamnesisRouter } from '../src/routes/anamnesis';

const app = express();
app.set('json spaces', 2);
let decisionEngine: DecisionEngine;

try {
  decisionEngine = new DecisionEngine();
} catch (e: any) {
  console.error('Failed to init DecisionEngine:', e);
}

app.use(cors());
app.use(express.json());

// Mount Anamnesis router for Vercel Serverless Function
app.use(['/api/anamnesis', '/anamnesis'], anamnesisRouter);

const approveSchema = z.object({
  provider_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid provider wallet EVM address'),
  buyer_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid buyer wallet EVM address'),
  service_price: z.number().positive('Service price must be greater than zero'),
  service_category: z.string().min(1, 'Service category is required'),
  deadline: z.string().optional(),
});

app.get(['/health', '/api/health', '/api'], (_req: Request, res: Response) => {
  try {
    return res.status(200).json({
      status: 'ok',
      asp_name: 'Custos',
      asp_category: 'Finance Copilot',
      description: 'Pre-Transaction Decision Engine for OKX.AI (X Layer Network)',
      version: '1.0.0',
      chain_id: CONFIG.XLAYER_CHAIN_ID,
      rpc_endpoint: CONFIG.XLAYER_RPC_URL,
      x402_supported: true,
      x402_payment_wallet: CONFIG.X402_PAYMENT_WALLET,
      endpoints: {
        approve: 'POST /approve',
        mcp_tools: ['custos_approve_transaction'],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Health error', details: err?.message || String(err) });
  }
});

app.post(['/approve', '/api/approve'], async (req: Request, res: Response) => {
  try {
    const parseResult = approveSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid input parameters',
        details: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    if (!decisionEngine) {
      decisionEngine = new DecisionEngine();
    }

    const decision = await decisionEngine.evaluate(parseResult.data);
    return res.status(200).json(decision);
  } catch (error: any) {
    console.error('Custos decision error:', error);
    return res.status(500).json({
      error: 'Internal Server Error during evaluation',
      message: error?.message || String(error),
      stack: error?.stack,
    });
  }
});

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Vercel Handler Crash',
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
}
