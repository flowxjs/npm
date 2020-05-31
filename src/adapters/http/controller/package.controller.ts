import crypto from 'crypto';
import url from 'url';
import { inject } from 'inversify';
import { Connection } from 'typeorm';
import { Controller, BadRequestException, useException } from '@flowx/http';
import { TPackageInput } from '../dto/package.dto';
import { MaintainerService } from '../../../modules/maintainer/maintainer.service';
import { PackageService } from '../../../modules/package/package.service';
import { THttpContext } from '../../../app.bootstrap';
import { PackageEntity } from '../../../modules/package/package.mysql.entity';
import { MaintainerEntity } from '../../../modules/maintainer/maintainer.mysql.entity';
import { UserException } from '../exceptions/user.exception';
import { DOMAIN } from '../../../app.config';

@Controller()
@useException(UserException)
export class HttpPackageController {
  @inject('MySQL') connection: Connection;
  @inject(MaintainerService) private MaintainerService: MaintainerService;
  @inject(PackageService) private PackageService: PackageService;

  async publish(user: THttpContext['user'], meta: {
    scope: string;
    pkgname: string;
    version?: string;
  }, pkg: TPackageInput) {
    const filename = Object.keys(pkg._attachments)[0];
    const version = Object.keys(pkg.versions)[0];
    const distTags = pkg['dist-tags'] || {};
    const attachment = pkg._attachments[filename];
    
    if (meta.version && meta.version !== version) {
      throw new BadRequestException('错误的版本');
    }

    const runner = this.connection.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    const PackageRepository = runner.manager.getRepository(PackageEntity);
    const MaintainerRepository = runner.manager.getRepository(MaintainerEntity);

    try {
      const packageExists = !!(await this.PackageService.findByPathname(PackageRepository, meta.scope + '/' + meta.pkgname));
      const PackageChunk = await this.PackageService.insert(PackageRepository, meta.scope + '/' + meta.pkgname, user.id);
      
      if (packageExists) {
        const maintainerCount = await this.MaintainerService.getCountByPidAndUid(MaintainerRepository, PackageChunk.id, user.id);
        if (maintainerCount === 0) throw new BadRequestException('你没有权限提交此模块');
      }
      
      // 将上传的包的base64数据转换成Buffer流
      // 以便使用fs存储到磁盘上
      const tarballBuffer = Buffer.from(attachment.data, 'base64');
      if (tarballBuffer.length !== attachment.length) {
        throw new BadRequestException(`size_wrong: Attachment size ${attachment.length} not match download size ${tarballBuffer.length}`);
      }

      // 创建 tarball 的 Buffer 流的 shasum 编码
      const shasum = this.createShasumCode(tarballBuffer);

      // 检测shasum编码是否合法
      if (pkg.versions[version].dist.shasum !== shasum) {
        throw new Error(`shasum_wrong: Attachment shasum ${shasum} not match download size ${pkg.versions[version].dist.shasum}`);
      }

      // 修改tarball地址
      pkg.versions[version].dist.tarball = url.resolve(DOMAIN, '/-/download/' + meta.scope + '/' + meta.pkgname + '/' + version);

      await this.MaintainerService.add(MaintainerRepository, PackageChunk.id, user.id);

      await runner.commitTransaction();
    } catch(e) {
      await runner.rollbackTransaction();
      throw e;
    } finally {
      await runner.release();
    }
  }

  /**
   * 数据源SHA1加密
   * @param tarballBuffer {Buffer} 数据源Buffer
   * @returns string
   */
  createShasumCode(tarballBuffer: Buffer) {
    const shasum = crypto.createHash('sha1');
    shasum.update(tarballBuffer);
    return shasum.digest('hex');
  }
}