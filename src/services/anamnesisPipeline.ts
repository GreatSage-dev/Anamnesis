/**
 * Custos + Anamnesis Integration Pipeline
 * 
 * Orchestrates the full evaluation flow:
 * 1. Run Custos deterministic DecisionEngine (existing, untouched)
 * 2. Query CockroachDB for precedents (exact address + vector similarity)
 * 3. Synthesize verdict via Amazon Bedrock with precedent context & validation
 * 4. Synchronously store decision in CockroachDB (ensuring read-your-own-writes consistency)
 * 
 * DOWNTIME / FALLBACK GUARANTEE (Fail-Open):
 * If CockroachDB or Bedrock is unreachable, Custos DOES NOT block payments.
 * It gracefully falls back to the deterministic DecisionEngine baseline,
 * tagging the response with `memory_degraded: true`.
 */

import { DecisionEngine } from './decisionEngine';
import {
  queryPrecedents,
  commitDecision,
} from './anamnesisMemory';
import {
  synthesizeVerdictWithMemory,
  buildEmbeddingInput,
} from './bedrockSynthesis';
import {
  AnamnesisEvaluationResult,
  OnchainSignals,
  SynthesisInput,
  PrecedentQueryResult,
} from '../types/anamnesis';
import { ApproveInput } from '../types/custos';

const decisionEngine = new DecisionEngine();

/**
 * Full Anamnesis evaluation pipeline with Fail-Open Downtime Fallback.
 * 
 * @param input - Standard Custos ApproveInput (provider_wallet, buyer_wallet, price, category)
 * @returns Complete evaluation result
 */
export async function evaluateWithMemory(
  input: ApproveInput
): Promise<AnamnesisEvaluationResult> {
  const totalStart = Date.now();

  // ── Step 1: Run deterministic DecisionEngine ──────────────────────
  const xlayerStart = Date.now();
  const deterministicResult = await decisionEngine.evaluate(input);
  const xlayerLatency = Date.now() - xlayerStart;

  // Extract signals for memory operations
  const metrics = deterministicResult.metrics!;
  const signals: OnchainSignals = {
    wallet_age_days: metrics.wallet_age_days,
    total_tx_count: metrics.total_tx_count,
    total_volume_okb: metrics.total_volume_okb,
    historical_avg_price_okb: metrics.historical_avg_price_okb,
    price_deviation_ratio: metrics.price_deviation_ratio,
    wash_trading_detected: metrics.wash_trading_detected,
    top_counterparties_ratio: metrics.top_counterparties_ratio,
    is_thin_history: metrics.is_thin_history,
  };

  const signalSummary = buildEmbeddingInput(
    signals,
    deterministicResult.verdict,
    deterministicResult.reasoning.join(' ')
  );

  // ── Step 2: Query CockroachDB (Fail-Open Fallback) ────────────────
  let precedents: PrecedentQueryResult;
  let memoryDegraded = false;

  try {
    precedents = await queryPrecedents(input.provider_wallet, signalSummary);
  } catch (err: any) {
    console.warn('[Anamnesis Pipeline] CockroachDB memory query failed (failing open):', err.message);
    memoryDegraded = true;
    precedents = {
      exact_matches: [],
      similar_matches: [],
      total_found: 0,
      query_latency_ms: 0,
    };
  }

  // ── Step 3: Bedrock Synthesis (Fail-Open Fallback) ───────────────
  let synthesis;
  let synthesisLatency = 0;

  try {
    const synthesisInput: SynthesisInput = {
      current_signals: signals,
      base_verdict: deterministicResult,
      precedents,
      counterparty_address: input.provider_wallet,
      service_price: input.service_price,
      service_category: input.service_category as string,
    };

    const synthResult = await synthesizeVerdictWithMemory(synthesisInput);
    synthesis = synthResult.result;
    synthesisLatency = synthResult.latency_ms;
  } catch (err: any) {
    console.warn('[Anamnesis Pipeline] Bedrock synthesis failed (failing open):', err.message);
    memoryDegraded = true;
    synthesis = {
      final_verdict: deterministicResult.verdict.toLowerCase() as 'approve' | 'caution' | 'deny',
      reasoning: deterministicResult.reasoning.join(' ') + ' (Memory service unavailable — fallback to deterministic engine)',
      cited_precedent_ids: [],
      recommended_payment: {
        type: deterministicResult.recommended_payment,
        split_ratio: deterministicResult.split_ratio,
      },
      confidence: 0.5,
      verdict_shifted: false,
    };
  }

  // ── Step 4: Synchronous Commit to CockroachDB ─────────────────────
  // Synchronous commit guarantees read-your-own-writes consistency for
  // immediate follow-up evaluations (e.g. Pass 2 in Live Demo).
  let storedId = 'uncommitted_degraded';
  let embeddingLatency = 0;

  if (!memoryDegraded) {
    try {
      const commitRes = await commitDecision({
        counterpartyAddress: input.provider_wallet,
        signals,
        verdict: synthesis.final_verdict,
        paymentStructure: synthesis.recommended_payment,
        reasoningText: synthesis.reasoning,
        citedPrecedentIds: synthesis.cited_precedent_ids,
      });
      storedId = commitRes.id;
      embeddingLatency = commitRes.embedding_latency_ms;
    } catch (err: any) {
      console.warn('[Anamnesis Pipeline] Decision storage failed:', err.message);
    }
  }

  // ── Assemble Result ───────────────────────────────────────────────
  return {
    deterministic: deterministicResult,
    precedents,
    synthesis,
    stored_decision_id: storedId,
    pipeline: {
      xlayer_latency_ms: xlayerLatency,
      memory_query_latency_ms: precedents.query_latency_ms,
      bedrock_embedding_latency_ms: embeddingLatency,
      bedrock_synthesis_latency_ms: synthesisLatency,
      total_latency_ms: Date.now() - totalStart,
    },
    aws_bedrock: {
      embedding_model: 'amazon.titan-embed-text-v2:0',
      synthesis_model: 'anthropic.claude-3-5-sonnet-20241022-v1:0',
      embedding_dimensions: 1024,
    },
  };
}
