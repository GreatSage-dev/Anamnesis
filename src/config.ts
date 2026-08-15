import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // X Layer RPC configuration
  XLAYER_RPC_URL: process.env.XLAYER_RPC_URL || 'https://testrpc.xlayer.tech',
  XLAYER_FALLBACK_RPC_URL: 'https://rpc.xlayer.tech',
  XLAYER_CHAIN_ID: process.env.XLAYER_CHAIN_ID ? parseInt(process.env.XLAYER_CHAIN_ID, 10) : 1952,

  // OKLink Explorer API
  OKLINK_API_KEY: process.env.OKLINK_API_KEY || '',
  OKLINK_BASE_URL: process.env.OKLINK_BASE_URL || 'https://www.oklink.com/api/v5/explorer',

  // x402 Protocol settings
  X402_PAYMENT_WALLET: process.env.X402_PAYMENT_WALLET || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  X402_PRICE_USDT: process.env.X402_PRICE_USDT || '0.01',

  // Category price medians (in OKB) used as benchmark for price deviation & thin history fallback
  CATEGORY_MEDIANS: {
    audit: 150,
    code_generation: 40,
    trading_signal: 15,
    data_feed: 5,
    infrastructure: 80,
    general: 25,
  } as Record<string, number>,

  // ─── Anamnesis: Decision Memory Layer ───────────────────────────
  ANAMNESIS_ENABLED: process.env.ANAMNESIS_ENABLED !== 'false',

  // CockroachDB Cloud
  DATABASE_URL: process.env.DATABASE_URL || '',

  // AWS Bedrock
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_BEDROCK_EMBEDDING_MODEL: process.env.AWS_BEDROCK_EMBEDDING_MODEL || 'amazon.titan-embed-text-v2:0',
  AWS_BEDROCK_LLM_MODEL: process.env.AWS_BEDROCK_LLM_MODEL || 'us.anthropic.claude-3-5-sonnet-20241022-v1:0',
};
