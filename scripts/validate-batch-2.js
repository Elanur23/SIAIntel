/**
 * BATCH 2 MIGRATION VALIDATION SCRIPT
 * Checks if migrated modules correctly route through central boundary.
 * Run with: SHADOW_MODE=true node scripts/validate-batch-2.js
 */

const path = require('path');

// Use absolute paths to avoid module resolution issues in Windows/PowerShell
const translationServicePath = path.resolve(__dirname, '../lib/ai/translation-service');
const embeddingServicePath = path.resolve(__dirname, '../lib/ai/embedding-service');
const intelligenceProcessorPath = path.resolve(__dirname, '../lib/services/SiaIntelligenceProcessor');

const { translateStructuredArticle } = require(translationServicePath);
const { generateTextEmbedding } = require(embeddingServicePath);
const { processIncomingIntel } = require(intelligenceProcessorPath);

async function validate() {
  console.log('--- STARTING BATCH 2 VALIDATION (SHADOW_MODE) ---');
  console.log('SHADOW_MODE:', process.env.SHADOW_MODE);

  try {
    // 1. Validate Translation Service
    console.log('\n[1/3] Validating Translation Service...');
    const transResult = await translateStructuredArticle({
      text: 'Testing Batch 2 migration',
      targetLang: 'tr'
    });
    console.log('Translation Result:', JSON.stringify({
      systemLog: transResult.systemLog,
      hasSimulatedText: transResult.translatedText.includes('[SIMULATED TRANSLATION]')
    }, null, 2));

    // 2. Validate Embedding Service
    console.log('\n[2/3] Validating Embedding Service...');
    const embedResult = await generateTextEmbedding('Testing embedding boundary');
    console.log('Embedding Result:', JSON.stringify({
      isDefined: !!embedResult,
      length: embedResult ? embedResult.length : 0
    }, null, 2));

    // 3. Validate Intelligence Processor
    console.log('\n[3/3] Validating Intelligence Processor...');
    const intelResult = await processIncomingIntel({ data: { title: 'Batch 2 Intelligence Test' } });
    console.log('Intelligence Result:', JSON.stringify({
      success: intelResult.success,
      hasSimulatedData: intelResult.success && intelResult.data.en.title.includes('[SIMULATED RESPONSE]')
    }, null, 2));

    console.log('\n--- VALIDATION COMPLETE ---');
  } catch (err) {
    console.error('\n❌ VALIDATION FAILED:', err.message);
    process.exit(1);
  }
}

validate();
