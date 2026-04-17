import { logOperation } from '../observability'
import { PECL_DEPLOYMENT_MODE } from './config'
import { getGlobalKeyProvider, normalizePECLKeyId } from './crypto-provider'

export interface OperatorPrecheckSummary {
  strict_validation_mode: boolean
  shadow_mode: boolean
  pecl_mode: string
  selected_key_id_raw: string | null
  selected_key_id: string | null
  private_key_present: boolean
  loaded_key_ids: string[]
  loaded_key_count: number
  matching_public_key: boolean
  pass: boolean
}

export async function evaluateOperatorPrecheck(): Promise<OperatorPrecheckSummary> {
  const strictValidationMode = (process.env.VALIDATION_STRICT_MODE || '').trim().toLowerCase() === 'true'
  const shadowMode = (process.env.SHADOW_MODE || '').trim().toLowerCase() === 'true'

  const selectedKeyIdRaw = (process.env.PECL_SIGNING_KEY_ID || '').trim()
  const selectedKeyId = selectedKeyIdRaw ? normalizePECLKeyId(selectedKeyIdRaw) : ''
  const privateKeyPresent = !!(process.env.PECL_PRIVATE_KEY || '').trim()

  const keyProvider = getGlobalKeyProvider()
  const loadedKeyIds = (await keyProvider.listPublicKeys()).map((key) => key.keyId)
  const matchingPublicKey = !!selectedKeyId && loadedKeyIds.includes(selectedKeyId)

  const pass = !!selectedKeyId && privateKeyPresent && matchingPublicKey

  return {
    strict_validation_mode: strictValidationMode,
    shadow_mode: shadowMode,
    pecl_mode: PECL_DEPLOYMENT_MODE,
    selected_key_id_raw: selectedKeyIdRaw || null,
    selected_key_id: selectedKeyId || null,
    private_key_present: privateKeyPresent,
    loaded_key_ids: loadedKeyIds,
    loaded_key_count: loadedKeyIds.length,
    matching_public_key: matchingPublicKey,
    pass
  }
}

export function logOperatorPrecheckSummary(summary: OperatorPrecheckSummary): void {
  const level = summary.pass ? 'INFO' : 'ERROR'

  logOperation('OPERATOR', 'operator.precheck.mode_summary', level, 'Operator strict precheck mode summary', {
    metadata: {
      strict_validation_mode: summary.strict_validation_mode,
      shadow_mode: summary.shadow_mode,
      pecl_mode: summary.pecl_mode,
      selected_key_id_raw: summary.selected_key_id_raw,
      selected_key_id: summary.selected_key_id,
      private_key_present: summary.private_key_present,
      loaded_key_ids: summary.loaded_key_ids,
      loaded_key_count: summary.loaded_key_count,
      matching_public_key: summary.matching_public_key,
      pass: summary.pass
    }
  })
}
