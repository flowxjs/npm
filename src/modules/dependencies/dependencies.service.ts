import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
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
    repository: Repository<DependencyEntity>,
    vid: DependencyEntity['vid'],
    pathname: DependencyEntity['pathname'],
    value: DependencyEntity['value'],
    type: DependencyEntity['type']
  ) {
    const dependency = await repository.createQueryBuilder().where({
      vid, pathname, value, type
    }).getOne();
    if (!dependency) {
      const dep = new DependencyEntity();
      dep.ctime = new Date();
      dep.pathname = pathname;
      dep.type = type;
      dep.utime = new Date();
      dep.value = value;
      dep.vid = vid;
      return await repository.save(dep);
    }
    return dependency;
  }

  /**
   * 删除某个包版本下的所有依赖
   * @param id 
   */
  async delete(
    repository: Repository<DependencyEntity>, 
    vid: DependencyEntity['vid']
  ) {
    const [dependencies, count] = await repository.createQueryBuilder().where({ vid }).getManyAndCount();
    if (!count) return;
    await Promise.all(dependencies.map(dependency => repository.delete(dependency)));
  }
}