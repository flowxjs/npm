import * as BodyParser from 'koa-bodyparser';
import { inject } from 'inversify';
import { Controller, Http, useException, Post, Body, Url, HttpCode, useMiddleware, Put, Params } from '@flowx/http';
import { THttpContext } from '../../../app.bootstrap';
import { logException } from '../exceptions/log.exception';
import { TPackageInput, TPackageNormalizeOutput } from './package.dto';

/**
 * package uri mode
 *  - `/vue`                    /:pkgname
 *  - `/vue/1.0.0`              /:pkgname/:version
 *  - `/@nelts%2fnelts`         /@:scope
 *  - `/@nelts%2fnelts/1.0.0`   /@:scope/:version
 *  - `/@nelts/nelts`           /@:scope/:pkgname
 *  - `/@nelts/nelts/1.0.0`     /@:scope/:pkgname/:version
 */


enum PACKAGE_UI_MODE {
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

  @Put(PACKAGE_UI_MODE.SCOPE_COMPOSITION)
  @useMiddleware(BodyParser())
  async packageAction1(
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

  @Put(PACKAGE_UI_MODE.SCOPE_NORMALIZE)
  @useMiddleware(BodyParser())
  async packageAction2(
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

  @Put(PACKAGE_UI_MODE.SCOPE_NORMALIZE_WITH_VERSION)
  @useMiddleware(BodyParser())
  async packageAction4(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Params('version') version: string,
    @Body() body: TPackageInput
  ) {
    return this.togglePackageActions(body, { scope, pkgname, version });
  }

  private async togglePackageActions(body: TPackageInput, value: { scope: string, pkgname: string, version?: string }): Promise<TPackageNormalizeOutput> {
    if (body._attachments) {
      this.http.logger.warn('TogglePackageActions', 'Publish: ', body);
    } else if (body.versions && body.versions[body.version].deprecated) {
      this.http.logger.warn('TogglePackageActions', 'deprecated: ', body);
    } else {
      this.http.logger.warn('TogglePackageActions', 'Update: ', body);
    }
    return {
      ok: true,
    }
  }
}