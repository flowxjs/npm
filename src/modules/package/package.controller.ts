import { injectable, inject } from 'inversify';
import { Context } from '@flowx/container';
import { PackageService } from './package.service';

@injectable()
export class PackageController {
  @inject(PackageService) private readonly package: PackageService;

  fetch(ctx: Context, options: { scope?: string, pkgname: string, version?: string }) {
    let pathname: string;
    const { scope, pkgname, version } = options;
    const prefixes = [
      'https://registry.npm.taobao.org/',
      'http://registry.npmjs.org/'
    ];
    if (scope) {
      if (version) {
        pathname = `@${scope}/${pkgname}/${version}`;
      } else {
        pathname = `@${scope}/${pkgname}`;
      }
    } else {
      if (version) {
        pathname = `/${pkgname}/${version}`;
      } else {
        pathname = `/${pkgname}`;
      }
    }
    return this.package.anyFetch(prefixes, pathname);
  }
}