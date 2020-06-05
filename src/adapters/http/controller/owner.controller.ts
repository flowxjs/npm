import { Controller, Get, BadRequestException, NotAcceptableException, useException } from '@flowx/http';
import { TPackageInfomation } from '../../../modules/package/package.dto';
import { inject } from 'inversify';
import { Connection } from 'typeorm';
import { PackageEntity } from '../../../modules/package/package.mysql.entity';
import { PackageService } from '../../../modules/package/package.service';
import { MaintainerService } from '../../../modules/maintainer/maintainer.service';
import { MaintainerEntity } from '../../../modules/maintainer/maintainer.mysql.entity';
import { UserEntity } from '../../../modules/user/user.mysql.entity';
import { getCache } from '@flowx/redis';
import { UserException } from '../exceptions/user.exception';

@Controller()
@useException(UserException)
export class HttpOwnerController {
  @inject('MySQL') private connection: Connection;
  @inject(PackageService) private PackageService: PackageService;
  @inject(MaintainerService) private MaintainerService: MaintainerService;

  async addOwner(
    pkgname: string,
    body: {
      _id: TPackageInfomation['_id'],
      _rev: TPackageInfomation['_rev'],
      maintainers: TPackageInfomation['maintainers']
    },
    uid: number,
    referer: number
  ) {
    const runner = this.connection.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    const PackageRepository = runner.manager.getRepository(PackageEntity);
    const MaintainerRepository = runner.manager.getRepository(MaintainerEntity);
    const UserRepository = runner.manager.getRepository(UserEntity);
    const scope = '@' + pkgname.split('/')[0];
    const name = pkgname.split('/')[1];

    const Package = await this.PackageService.findByScopeAndName(PackageRepository, scope, name);
    if (!Package) return { error: '找不到模块' }
    if (Package.uid !== uid) return { error: '您没有权限操作' }
    const allMaintainers = await this.MaintainerService.findByPid(MaintainerRepository, Package.id);
    const maintainers = body.maintainers;
    let needUpdate = false;
    const pools: MaintainerEntity[] = [];
    try {
      for (let i = 0; i < maintainers.length; i++) {
        const [maintainer, user] = await this.MaintainerService.getMaintainerExistsByAccount(
          UserRepository,
          MaintainerRepository,
          Package.id,
          maintainers[i].name,
          referer
        );
        if (maintainer) {
          pools.push(maintainer);
          continue;
        }
        if (!user) {
          await runner.rollbackTransaction();
          return { error: '用户不存在' }
        }
        pools.push(await this.MaintainerService.add(MaintainerRepository, Package.id, user.id));
        needUpdate = true;
      }
      const deleteMaintainers = this.Computed(allMaintainers, pools);
      for (let j = 0; j < deleteMaintainers.length; j++) {
        if (deleteMaintainers[j].uid === Package.uid) {
          await runner.rollbackTransaction();
          return { error: '无法删除模块发布者账号' }
        }
        await MaintainerRepository.delete(deleteMaintainers[j]);
      }
      if (deleteMaintainers.length) needUpdate = true;
      needUpdate && await getCache(PackageService, 'info').build(PackageRepository, scope, name);
      await runner.commitTransaction();
    } catch(e) {
      await runner.rollbackTransaction();
      return { error: e.message }
    } finally {
      await runner.release();
    }
    return {
      ok: true
    }
  }

  Computed(oldMaintainers: MaintainerEntity[], newMaintainers: MaintainerEntity[]) {
    const removes: MaintainerEntity[] = [];
    const newIDs = newMaintainers.map(maintainer => maintainer.id);
    for (let i = 0; i < oldMaintainers.length; i++) {
      if (newIDs.indexOf(oldMaintainers[i].id) === -1) {
        removes.push(oldMaintainers[i])
      }
    }
    return removes;
  }
}