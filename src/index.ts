import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { z } from 'zod';
import { CONFIG } from './config';
import { DecisionEngine } from './services/decisionEngine';
import { x402Middleware } from './middleware/x402';
import { errorHandler } from './middleware/errorHandler';
import { anamnesisRouter } from './routes/anamnesis';
import { initializeSchema } from './db/schema';

const app = express();
const decisionEngine = new DecisionEngine();

app.use(cors());
app.use(express.json());
app.use(x402Middleware);

// Vercel serverless path normalization middleware
app.use((req, _res, next) => {
  const originalUrl = req.url;
  const pathOnly = req.path;

  if (pathOnly === '/api' || pathOnly === '/api/') {
    if (req.method === 'POST') {
      req.url = '/approve' + (originalUrl.includes('?') ? '?' + originalUrl.split('?')[1] : '');
    } else if (req.method === 'GET') {
      req.url = '/health' + (originalUrl.includes('?') ? '?' + originalUrl.split('?')[1] : '');
    }
  } else if (pathOnly.startsWith('/api/') && !pathOnly.startsWith('/api/anamnesis')) {
    req.url = originalUrl.replace(/^\/api/, '');
  }
  next();
});

if (!process.env.VERCEL) {
  try {
    const publicPath = path.resolve(process.cwd(), 'public');
    app.use(express.static(publicPath));
  } catch (e) {
    // Ignore static directory missing in serverless environment
  }
}

const approveSchema = z.object({
  provider_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid provider wallet EVM address'),
  buyer_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid buyer wallet EVM address'),
  service_price: z.number().positive('Service price must be greater than zero'),
  service_category: z.string().min(1, 'Service category is required'),
  deadline: z.string().optional(),
});

app.get(['/health', '/api/health', '/api'], (_req: Request, res: Response) => {
  res.json({
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
});

app.post(['/approve', '/api/approve', '/api'], async (req: Request, res: Response, next) => {
  try {
    const parseResult = approveSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid input parameters',
        details: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
    }

    const decision = await decisionEngine.evaluate(parseResult.data);
    return res.json(decision);
  } catch (error) {
    return next(error);
  }
});

// ─── Anamnesis Memory Layer Routes ──────────────────────────────────
app.use(['/api/anamnesis', '/anamnesis'], anamnesisRouter);

app.use(errorHandler);

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  // Initialize CockroachDB schema before starting server
  const startServer = async () => {
    if (CONFIG.ANAMNESIS_ENABLED && CONFIG.DATABASE_URL) {
      try {
        const schemaResult = await initializeSchema();
        console.log(`🧠 Anamnesis: CockroachDB schema initialized (vector index: ${schemaResult.vector_index_status})`);
      } catch (err: any) {
        console.warn(`⚠️  Anamnesis: CockroachDB init warning: ${err.message}`);
        console.warn('    Anamnesis memory features will be unavailable until DATABASE_URL is configured.');
      }
    }

    app.listen(CONFIG.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🛡️ Custos ASP Server listening on http://localhost:${CONFIG.PORT}`);
      console.log(`🔗 Network: X Layer (Chain ID ${CONFIG.XLAYER_CHAIN_ID})`);
      console.log(`💳 x402 Payment Address: ${CONFIG.X402_PAYMENT_WALLET}`);
      console.log(`🧠 Anamnesis: ${CONFIG.ANAMNESIS_ENABLED && CONFIG.DATABASE_URL ? 'ACTIVE' : 'DISABLED (no DATABASE_URL)'}`);
      console.log(`=======================================================`);
    });
  };

  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
