import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm';
import { DependencyEntity } from './dependency.mysql.entity';

@injectable()
export class DependenciesService {
  @inject('MySQL') connection: Connection;

  /**
   * 添加依赖
   * @param vid 
   * @param pathname 
   * @param version 
   * @param type 
   */
  async add(
    vid: DependencyEntity['vid'],
    pathname: DependencyEntity['pathname'],
    version: DependencyEntity['version'],
    type: DependencyEntity['type']
  ) {
    const repository = this.connection.getRepository(DependencyEntity);
    const dependency = await repository.createQueryBuilder().where({
      vid, pathname, version, type
    }).getOne();
    if (!dependency) {
      const dep = new DependencyEntity();
      dep.ctime = new Date();
      dep.isDeleted = false;
      dep.pathname = pathname;
      dep.type = type;
      dep.utime = new Date();
      dep.version = version;
      dep.vid = vid;
      return await repository.save(dep);
    }
    if (dependency.isDeleted) {
      dependency.isDeleted = false;
      dependency.utime = new Date();
      return await repository.save(dependency);
    }
    return dependency;
  }

  /**
   * 删除某个包版本下的所有依赖
   * @param id 
   */
  async delete(vid: DependencyEntity['vid']) {
    const repository = this.connection.getRepository(DependencyEntity);
    const [dependencies, count] = await repository.createQueryBuilder().where({ 
      vid, isDeleted: false 
    }).getManyAndCount();
    if (!count) return;
    await Promise.all(dependencies.map(dependency => {
      dependency.isDeleted = true;
      dependency.utime = new Date();
      return repository.save(dependency);
    }));
  }
}