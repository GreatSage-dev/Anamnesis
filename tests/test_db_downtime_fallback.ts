import { evaluateWithMemory } from '../src/services/anamnesisPipeline';
import { setPool, resetPool } from '../src/db/client';

async function testDowntimeFallback() {
  console.log('=== TEST: CockroachDB Downtime Fallback (Fail-Open Verification) ===\n');

  // Inject a broken mock pool that simulates CockroachDB downtime
  const brokenPool = {
    query: async () => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:26257 (Simulated CockroachDB Outage)');
    },
  };

  setPool(brokenPool);

  const testInput = {
    provider_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    buyer_wallet: '0x1234567890123456789012345678901234567890',
    service_price: 50.0,
    service_category: 'trading_signal',
  };

  console.log('Executing evaluation with CockroachDB down...');
  const result = await evaluateWithMemory(testInput);

  console.log('\n--- EVALUATION RESULT UNDER DOWNTIME ---');
  console.log('Deterministic Verdict:', result.deterministic.verdict);
  console.log('Final Synthesis Verdict:', result.synthesis.final_verdict);
  console.log('Precedents Found:', result.precedents.total_found);
  console.log('Cited Precedent IDs:', result.synthesis.cited_precedent_ids);
  console.log('Stored Decision ID:', result.stored_decision_id);
  console.log('Full Reasoning Text:\n', result.synthesis.reasoning);

  // Assertions
  const failOpenSuccess = result.synthesis.final_verdict !== undefined;
  const noFakePrecedent = result.synthesis.cited_precedent_ids.length === 0;
  const noFalseClaimInReasoning = !result.synthesis.reasoning.includes('Consistent with a prior') && !result.synthesis.reasoning.includes('Precedent #');

  console.log('\n=== ASSERTION CHECKLIST ===');
  console.log('1. System Failed Open (Produced valid verdict instead of crashing):', failOpenSuccess ? '✅ PASSED' : '❌ FAILED');
  console.log('2. Zero Fake Precedents Cited (cited_precedent_ids is empty):', noFakePrecedent ? '✅ PASSED' : '❌ FAILED');
  console.log('3. Reasoning Text Honest (No false precedent claims when DB offline):', noFalseClaimInReasoning ? '✅ PASSED' : '❌ FAILED');

  resetPool();

  if (failOpenSuccess && noFakePrecedent && noFalseClaimInReasoning) {
    console.log('\n🎉 ALL DOWNTIME FALLBACK TESTS PASSED 100%!');
  } else {
    console.log('\n❌ DOWNTIME TEST FAILED!');
    process.exit(1);
  }
}

testDowntimeFallback().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
