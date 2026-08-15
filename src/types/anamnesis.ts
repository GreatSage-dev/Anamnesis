/**
 * Anamnesis — Decision Memory Layer Type Definitions
 * Types for CockroachDB memory records, Bedrock synthesis, and precedent retrieval.
 */

import { ApproveOutput, WalletMetricsSummary } from './custos';

// ─── Memory Record (CockroachDB Row) ────────────────────────────────

export interface DecisionMemoryRecord {
  id: string;
  counterparty_address: string;
  created_at: string;
  onchain_signals: OnchainSignals;
  verdict: string;
  recommended_payment_structure: PaymentStructure;
  reasoning_text: string;
  reasoning_vector?: number[];
  cited_precedent_ids: string[];
}

export interface OnchainSignals {
  wallet_age_days: number;
  total_tx_count: number;
  total_volume_okb: number;
  historical_avg_price_okb: number;
  price_deviation_ratio: number;
  wash_trading_detected: boolean;
  top_counterparties_ratio: number;
  is_thin_history: boolean;
}

export interface PaymentStructure {
  type: 'full_upfront' | 'split' | 'escrow';
  split_ratio?: string;
}

// ─── Precedent Retrieval ────────────────────────────────────────────

export interface RetrievedPrecedent {
  id: string;
  counterparty_address: string;
  created_at: string;
  verdict: string;
  reasoning_text: string;
  onchain_signals: OnchainSignals;
  recommended_payment_structure: PaymentStructure;
  match_type: 'exact_address' | 'vector_similarity';
  distance?: number;
}

export interface PrecedentQueryResult {
  exact_matches: RetrievedPrecedent[];
  similar_matches: RetrievedPrecedent[];
  total_found: number;
  query_latency_ms: number;
}

// ─── Bedrock Synthesis ──────────────────────────────────────────────

export interface SynthesisInput {
  current_signals: OnchainSignals;
  base_verdict: ApproveOutput;
  precedents: PrecedentQueryResult;
  counterparty_address: string;
  service_price: number;
  service_category: string;
}

export interface SynthesisOutput {
  final_verdict: 'approve' | 'caution' | 'deny';
  reasoning: string;
  cited_precedent_ids: string[];
  recommended_payment: PaymentStructure;
  confidence: number;
  verdict_shifted: boolean;
  shift_explanation?: string;
}

// ─── Full Anamnesis Evaluation Result ───────────────────────────────

export interface AnamnesisEvaluationResult {
  /** The original deterministic verdict from Custos DecisionEngine */
  deterministic: ApproveOutput;
  /** Precedents retrieved from CockroachDB */
  precedents: PrecedentQueryResult;
  /** Bedrock-synthesized verdict informed by memory */
  synthesis: SynthesisOutput;
  /** The decision record stored in CockroachDB */
  stored_decision_id: string;
  /** Metadata about the evaluation pipeline */
  pipeline: {
    xlayer_latency_ms: number;
    memory_query_latency_ms: number;
    bedrock_embedding_latency_ms: number;
    bedrock_synthesis_latency_ms: number;
    total_latency_ms: number;
  };
  /** AWS Bedrock metadata (visible for hackathon judges) */
  aws_bedrock: {
    embedding_model: string;
    synthesis_model: string;
    embedding_dimensions: number;
  };
}

// ─── Decision DNA ───────────────────────────────────────────────────

export interface DecisionDNA {
  counterparty_address: string;
  wallet_age_score: number;        // 0-100
  tx_frequency_score: number;      // 0-100
  payment_consistency_score: number; // 0-100
  risk_score: number;              // 0-100
  total_decisions: number;
  approvals: number;
  cautions: number;
  denials: number;
}

// ─── System Health ──────────────────────────────────────────────────

export interface SystemHealth {
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
    last_embedding_latency_ms?: number;
    last_synthesis_latency_ms?: number;
  };
  xlayer: {
    connected: boolean;
    rpc_url: string;
    current_block?: number;
    chain_id: number;
    latency_ms: number;
  };
}

// ─── API Response Types ─────────────────────────────────────────────

export interface StatsResponse {
  total_decisions: number;
  verdicts: {
    approve: number;
    caution: number;
    deny: number;
  };
  unique_counterparties: number;
  recent_decisions: DecisionMemoryRecord[];
}

export interface DecisionListResponse {
  decisions: DecisionMemoryRecord[];
  total: number;
  page: number;
  per_page: number;
}
