/**
 * package uri mode
 *  - `/vue`                    /:pkgname
 *  - `/vue/1.0.0`              /:pkgname/:version
 *  - `/@nelts%2fnelts`         /@:scope
 *  - `/@nelts%2fnelts/1.0.0`   /@:scope/:version
 *  - `/@nelts/nelts`           /@:scope/:pkgname
 *  - `/@nelts/nelts/1.0.0`     /@:scope/:pkgname/:version
 */
export enum PACKAGE_URI_MODE {
  NO_SCOPE = '/:pkgname',
  NO_SCOPE_WITH_VESION = '/:pkgname/:version',
  SCOPE_COMPOSITION = '/@:scope',
  SCOPE_COMPOSITION_WITH_VERSION = '/@:scope/:version',
  SCOPE_NORMALIZE = '/@:scope/:pkgname',
  SCOPE_NORMALIZE_WITH_VERSION = '/@:scope/:pkgname/:version',
}