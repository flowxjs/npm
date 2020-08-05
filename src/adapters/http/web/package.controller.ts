import url from 'url';
import request from 'request';
import { Controller, Get, Params, BadGatewayException } from "@flowx/http";
import { inject } from "inversify";
import { HttpFetchController } from "../controller/fetch.controller";
const cheerio = require('cheerio');

@Controller('/--/package')
export class HttpPackageWebController {
  @inject(HttpFetchController) private readonly HttpFetchController: HttpFetchController;
  
  @Get('/:pkgname')
  getPackageBypkgname(
    @Params('pkgname') pkgname: string
  ) {
    return this.getPackage({
      pkgname
    })
  }

  @Get('/:pkgname/v/:version')
  getPackageBypkgnameWithVersion(
    @Params('pkgname') pkgname: string,
    @Params('version') version: string
  ) {
    return this.getPackage({
      pkgname, version
    })
  }

  @Get('/@:scope/:pkgname')
  getPackageByScopeAndpkgname(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string
  ) {
    return this.getPackage({
      pkgname, scope,
    })
  }

  @Get('/@:scope/:pkgname/v/:version')
  getPackageByScopeAndpkgnameWithVersion(
    @Params('scope') scope: string,
    @Params('pkgname') pkgname: string,
    @Params('version') version: string
  ) {
    return this.getPackage({
      pkgname, version, scope,
    })
  }

  private getNpmReadMe(pkgname: string) {
    const uri = url.resolve('https://www.npmjs.com/package', pkgname);
    return new Promise<string>((resolve, reject) => {
      request.get(uri, (err: Error, response: request.Response, body: string) => {
        if (err) return reject(err);
        if (response.statusCode >= 300 || response.statusCode < 200) return reject(new BadGatewayException());
        const $ = cheerio.load(body);
        const text: string = $('#readme').html();
        resolve(text);
      })
    })
  }

  private async getPackage(options: {scope?: string, pkgname: string, version?: string}) {
    const data = await this.HttpFetchController.getPackage(options, false);
    if (!data.readme) {
      let pathname: string;
      const { scope, pkgname, version } = options;
      if (scope) {
        if (version) {
          pathname = `@${scope}/${pkgname}/v/${version}`;
        } else {
          pathname = `@${scope}/${pkgname}`;
        }
      } else {
        if (version) {
          pathname = `/${pkgname}/v/${version}`;
        } else {
          pathname = `/${pkgname}`;
        }
      }
      data.readme = await this.getNpmReadMe(pathname)
    }
    return data;
  }
}