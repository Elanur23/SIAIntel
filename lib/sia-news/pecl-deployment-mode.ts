/**
 * PECL deployment mode accessor.
 *
 * Keeps direct stabilization config loading isolated in a tiny adapter module.
 */
export function getPeclDeploymentMode(): string {
  const { PECL_DEPLOYMENT_MODE } = require('../neural-assembly/stabilization/config')
  return PECL_DEPLOYMENT_MODE
}
