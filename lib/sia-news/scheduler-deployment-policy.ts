/**
 * Scheduler deployment policy gate.
 *
 * Centralizes deployment-mode checks for scheduler approval/publication
 * paths behind a single adapter.
 */

import { getPeclDeploymentMode } from './pecl-deployment-mode'

export interface SchedulerDeploymentPolicy {
  allowApprovalAndPublish: boolean
  mode: string
}

export function getSchedulerDeploymentPolicy(): SchedulerDeploymentPolicy {
  const mode = getPeclDeploymentMode()

  return {
    allowApprovalAndPublish: mode !== 'ENFORCE',
    mode,
  }
}