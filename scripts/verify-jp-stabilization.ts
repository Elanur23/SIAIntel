import { MasterOrchestrator } from '../lib/neural-assembly/master-orchestrator'

async function verify() {
  console.log('🔍 Verifying JP Stabilization Remediation')
  const orchestrator = new MasterOrchestrator()

  const mic: any = {
    id: 'test-mic-jp-remediation',
    version: 1,
    metadata: { category: 'Test' },
    truth_nucleus: { facts: [{ statement: 'AI is changing the world.' }], impact_analysis: 'High', geopolitical_context: 'Global' },
    structural_atoms: { core_thesis: 'AI Revolution', key_entities: ['AI'], temporal_markers: [], numerical_data: [] }
  }

  const plan: any = {
    language: 'jp',
    tone: 'formal',
    jargon_level: 'general',
    seo_hook: 'AI in Japan',
    sovereign_context: 'Japan specific',
    target_length: 300
  }

  process.env.SHADOW_MODE = 'false';
  process.env.NODE_ENV = 'production';

  try {
    const edition = await orchestrator.generateEdition(mic, plan, 'jp');
    const response = {
      title: edition.content.title,
      fullContent: edition.content.body.full,
    }
    console.log('✅ JP Generation Succeeded');
    console.log('Title:', response.title);
    console.log('Full Content Length:', response.fullContent.length);
    console.log('Start of content:', response.fullContent.substring(0, 500));

    // Check if it's valid JSON (implicitly verified by parseEditionResponse in the provider)
    if (response.title !== 'Generated Article') {
      console.log('✅ Structured data closure verified');
    } else {
      console.warn('⚠️ Fallback to raw text detected (JSON parse might have failed)');
    }
  } catch (e: any) {
    console.error('❌ JP Generation Failed:', e.message);
  }
}

verify().catch(console.error)
