import { generateEditionWithLLM } from '../lib/neural-assembly/llm-provider'
import * as fs from 'fs'

async function verify() {
  const env = fs.readFileSync('.env', 'utf8');
  env.split(/\r?\n/).forEach(l => {
    const parts = l.split('=');
    if (parts.length >= 2) {
      const k = parts[0].trim();
      const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[k] = v;
    }
  });

  console.log('🔍 Verifying EN (Non-JP) Stability')
  console.log('GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
  if (process.env.GROQ_API_KEY) {
    console.log('GROQ_API_KEY starts with:', process.env.GROQ_API_KEY.substring(0, 5));
  }

  const mic: any = {
    id: 'test-mic-en-remediation',
    version: 1,
    metadata: { category: 'Test' },
    truth_nucleus: { facts: [{ statement: 'AI is changing the world.' }], impact_analysis: 'High', geopolitical_context: 'Global' },
    structural_atoms: { core_thesis: 'AI Revolution', key_entities: ['AI'], temporal_markers: [], numerical_data: [] }
  }

  const plan: any = {
    language: 'en',
    tone: 'formal',
    jargon_level: 'general',
    seo_hook: 'AI in World',
    sovereign_context: 'Global context',
    target_length: 300
  }

  process.env.SHADOW_MODE = 'false';
  process.env.NODE_ENV = 'production';

  try {
    const response = await generateEditionWithLLM({ mic, plan, language: 'en' });
    console.log('✅ EN Generation Succeeded');
    console.log('Title:', response.title);
    console.log('Temperature check (via logs if possible): Default should be used');
  } catch (e: any) {
    console.error('❌ EN Generation Failed:', e.message);
  }
}

verify().catch(console.error)
