import * as BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { Controller, Http, useException, Post, Body, Url, HttpCode, useMiddleware, Put, Params, Get } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { logException } from '../exceptions/log.exception';
import { TPackageInput, TPackageNormalizeOutput } from './package.dto';
import { PackageController } from '../../../modules/package/package.controller';

/**
 * package uri mode
 *  - `/vue`                    /:pkgname
 *  - `/vue/1.0.0`              /:pkgname/:version
 *  - `/@nelts%2fnelts`         /@:scope
 *  - `/@nelts%2fnelts/1.0.0`   /@:scope/:version
 *  - `/@nelts/nelts`           /@:scope/:pkgname
 *  - `/@nelts/nelts/1.0.0`     /@:scope/:pkgname/:version
 */


enum PACKAGE_URI_MODE {
  NO_SCOPE = '/:pkgname',
  NO_SCOPE_WITH_VESION = '/:pkgname/:version',
  SCOPE_COMPOSITION = '/@:scope',
  SCOPE_COMPOSITION_WITH_VERSION = '/@:scope/:version',
  SCOPE_NORMALIZE = '/@:scope/:pkgname',
  SCOPE_NORMALIZE_WITH_VERSION = '/@:scope/:pkgname/:version',
}

@Controller()
@useException(logException)
export class HttpExtraController {
  @inject('Http') private http: Http<THttpContext>;

  @Post('/-/v1/login')
  @useMiddleware(BodyParser())
  @HttpCode(404)
  Login(@Body() body: { hostname: string }, @Url() url: string) {
    this.http.logger.info(url, '', body);
    return 'not found';
  }

  @Get(PACKAGE_URI_MODE.NO_SCOPE)
  async getPackageNoScope(@Params('pkgname') pkgname: string) {
    return this.getPackage({ pkgname });
  }

  @Get(PACKAGE_URI_MODE.NO_SCOPE_WITH_VESION)
  async getPackageNoScopeWithVersion(
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
  ) {
    return this.getPackage({ pkgname, version });
  }

  @Get(PACKAGE_URI_MODE.SCOPE_COMPOSITION)
  async getPackageComposition(@Params('scope') scope: string) {
    const value = decodeURIComponent(scope);
    const chunk = value.split('/');
    return this.getPackage({ scope: chunk[0], pkgname: chunk[1] });
  }

  @Get(PACKAGE_URI_MODE.SCOPE_NORMALIZE)
  async getPackageCompositionOrWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
  ) {
    let _scope: string, _pkgname: string, _version: string;
    if (/^\d+\.\d+\.\d+(\-.+)?$/.test(pkgname)) {
      const value = decodeURIComponent(scope);
      const chunk = value.split('/');
      _version = pkgname;
      _scope = chunk[0];
      _pkgname = chunk[1];
    } else {
      _scope = scope;
      _pkgname = pkgname;
    }
    return this.getPackage({
      scope: _scope,
      pkgname: _pkgname,
      version: _version,
    });
  }

  @Get(PACKAGE_URI_MODE.SCOPE_NORMALIZE_WITH_VERSION)
  async getPackageWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
  ) {
    return this.getPackage({ scope, pkgname, version });
  }


  @Put(PACKAGE_URI_MODE.SCOPE_COMPOSITION)
  @useMiddleware(BodyParser())
  async packageActionComposition(
    @Params('scope') scope: string,
    @Body() body: TPackageInput
  ): Promise<TPackageNormalizeOutput> {
    const value = decodeURIComponent(scope);
    const chunk = value.split('/');
    return this.togglePackageActions(body, {
      scope: chunk[0],
      pkgname: chunk[1],
    });
  }

  @Put(PACKAGE_URI_MODE.SCOPE_NORMALIZE)
  @useMiddleware(BodyParser())
  async packageActionCompositionOrWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Body() body: TPackageInput
  ) {
    let _scope: string, _pkgname: string, _version: string;
    if (/^\d+\.\d+\.\d+(\-.+)?$/.test(pkgname)) {
      const value = decodeURIComponent(scope);
      const chunk = value.split('/');
      _version = pkgname;
      _scope = chunk[0];
      _pkgname = chunk[1];
    } else {
      _scope = scope;
      _pkgname = pkgname;
    }
    return this.togglePackageActions(body, {
      scope: _scope,
      pkgname: _pkgname,
      version: _version,
    });
  }

  @Put(PACKAGE_URI_MODE.SCOPE_NORMALIZE_WITH_VERSION)
  @useMiddleware(BodyParser())
  async packageActionWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
    @Body() body: TPackageInput
  ) {
    return this.togglePackageActions(body, { scope, pkgname, version });
  }

  private async togglePackageActions(body: TPackageInput, value: { scope: string, pkgname: string, version?: string }): Promise<TPackageNormalizeOutput> {
    this.http.logger.warn('TogglePackageActions', 'body: ', body);
    this.http.logger.warn('TogglePackageActions', 'value: ', value);
    return {
      ok: true,
    }
  }

  private async getPackage(options: {scope?: string, pkgname: string, version?: string}) {
    return await this.http.portal(PackageController, 'fetch', options);
  }
}