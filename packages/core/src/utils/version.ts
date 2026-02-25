/**
 * Version utility
 *
 * Provides the current version of @warpcms/core package
 */

import pkg from '../../package.json'

export const WARPJS_VERSION = pkg.version

/** @deprecated Use WARPJS_VERSION */
export const SONICJS_VERSION = pkg.version

/**
 * Get the current WarpCMS core version
 */
export function getWarpCMSVersion(): string {
  return WARPJS_VERSION
}

/**
 * Get the current core version
 * @deprecated Use getWarpCMSVersion
 */
export function getCoreVersion(): string {
  return WARPJS_VERSION
}
