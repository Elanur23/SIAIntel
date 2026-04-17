import { parseEditionResponse } from '../lib/neural-assembly/llm-provider'

function replay() {
  console.log('--- REPLAYING BATCH 01 RAW PAYLOAD ---')

  const rawPayload = `
Here is the requested news article in JSON format:

\`\`\`json
{
  "title": "EU AI Act: New Compliance Deadlines for Financial Services",
  "lead": "The European Union has reached a landmark political agreement on the AI Act, setting a global standard for AI regulation.",
  "summary": "Financial firms face strict transparency rules for high-risk AI systems with implementation starting in 2026.",
  "fullContent": "The European Parliament and Council have finalized the AI Act. This regulation introduces a risk-based approach... [truncated for test]",
  "keywords": ["AI Act", "EU", "Finance", "Regulation"]
}
\`\`\`

I hope this meets your requirements.
  `;

  const parsed = parseEditionResponse(rawPayload);

  console.log('Parsed Result:');
  console.log(JSON.stringify(parsed, null, 2));

  if (parsed.title === 'EU AI Act: New Compliance Deadlines for Financial Services') {
    console.log('✅ Parser correctly handled markdown fences and wrapper text.');
  } else {
    console.log('❌ Parser failed to extract title correctly.');
  }
}

replay();
