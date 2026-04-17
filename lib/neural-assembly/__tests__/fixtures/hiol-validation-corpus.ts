import { HIOL_ADVERSARIAL_CORPUS } from './hiol-adversarial-corpus'
import { HIOL_GOLDEN_VALIDATION_CORPUS } from './hiol-golden-corpus'
import { HIOL_MULTILINGUAL_SIMULATION_CORPUS } from './hiol-multilingual-simulation-corpus'
import { HIOL_TITLE_SURFACE_DIVERGENCE_CORPUS } from './hiol-title-surface-divergence-corpus'

export {
  HIOL_ADVERSARIAL_CORPUS,
  HIOL_GOLDEN_VALIDATION_CORPUS,
  HIOL_MULTILINGUAL_SIMULATION_CORPUS,
  HIOL_TITLE_SURFACE_DIVERGENCE_CORPUS
}

export * from './hiol-validation-corpus-types'

export const HIOL_ALL_VALIDATION_CORPUS = [
  ...HIOL_GOLDEN_VALIDATION_CORPUS,
  ...HIOL_ADVERSARIAL_CORPUS,
  ...HIOL_TITLE_SURFACE_DIVERGENCE_CORPUS
]
