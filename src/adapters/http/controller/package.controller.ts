import { Controller, BadRequestException } from '@flowx/http';
import { TPackageInput } from '../dto/package.dto';
import { MaintainerService } from '../../../modules/maintainer/maintainer.service';
import { inject } from 'inversify';
import { THttpContext } from '../../../app.bootstrap';

@Controller()
export class HttpPackageController {
  @inject(MaintainerService) MaintainerService: MaintainerService;

  async publish(user: THttpContext['user'], meta: {
    scope: string;
    pkgname: string;
    version?: string;
  }, pkg: TPackageInput) {
    const filename = Object.keys(pkg._attachments)[0];
    const version = Object.keys(pkg.versions)[0];
    const distTags = pkg['dist-tags'] || {};
    
    if (meta.version && meta.version !== version) {
      throw new BadRequestException('错误的版本');
    }

    
  }
}