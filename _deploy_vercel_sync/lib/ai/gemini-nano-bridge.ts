/**
 * SIA GEMINI NANO BRIDGE - V1.0 (ON-DEVICE INTELLIGENCE)
 * Interfaces with Chrome's built-in Gemini Nano model (window.ai)
 *
 * NOTE: Requires Chrome/Edge with "Prompt API" enabled in flags.
 */

export interface NanoCapabilities {
  available: 'no' | 'readily' | 'after-download';
  temperatureDefault: number;
  topKDefault: number;
}

/**
 * Checks if the browser supports built-in Gemini Nano
 */
export async function getNanoCapabilities(): Promise<NanoCapabilities> {
  if (typeof window === 'undefined' || !('ai' in window)) {
    return { available: 'no', temperatureDefault: 0, topKDefault: 0 };
  }

  try {
    // @ts-ignore - window.ai is experimental
    const capabilities = await window.ai.languageModel.capabilities();
    return {
      available: capabilities.available,
      temperatureDefault: capabilities.defaultTemperature || 0.7,
      topKDefault: capabilities.defaultTopK || 3
    };
  } catch (e) {
    console.warn('[SIA_NANO] Failed to get capabilities:', e);
    return { available: 'no', temperatureDefault: 0, topKDefault: 0 };
  }
}

/**
 * Runs a prompt through Gemini Nano (Local Browser AI)
 * Used as the ultimate fallback layer when all networks are offline.
 */
export async function runNanoAnalysis(prompt: string, systemPrompt: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('ai' in window)) return null;

  try {
    // @ts-ignore
    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available === 'no') return null;

    // @ts-ignore
    const session = await window.ai.languageModel.create({
      systemPrompt: systemPrompt
    });

    const result = await session.prompt(prompt);
    session.destroy();

    return result;
  } catch (e) {
    console.error('[SIA_NANO] Analysis failed:', e);
    return null;
  }
}

/**
 * Specialized hook for client-side components to use Nano
 */
export function isNanoReady(): boolean {
  // @ts-ignore
  return typeof window !== 'undefined' && !!(window.ai && window.ai.languageModel);
}
