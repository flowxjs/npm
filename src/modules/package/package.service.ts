import request from 'request';
import url from 'url';
import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { UserEntity } from '../user/user.mysql.entity';
import { PackageEntity } from './package.mysql.entity';

@injectable()
export class PackageService {
  @inject('MySQL') connection: Connection;

  /**
   * 查询远程模块信息
   * @param prefix 
   * @param pathname 
   */
  public fetch(prefix: string, pathname: string) {
    const uri = url.resolve(prefix, pathname);
    return new Promise<string>(resolve => {
      request.get(uri, (err: Error, response: request.Response, body: string) => {
        if (err) return resolve();
        if (response.statusCode >= 300 || response.statusCode < 200) return resolve();
        try {
          const data = JSON.parse(body);
          if (data.error) return resolve();
          data._npm_source_referer = uri;
          resolve(data);
        } catch(e) {
          resolve();
        }
      })
    })
  }

  /**
   * 队列查询远程模块信息
   * @param prefixes 
   * @param pathname 
   */
  public async anyFetch(prefixes: string[], pathname: string) {
    for (let i = 0; i < prefixes.length; i++) {
      const data = await this.fetch(prefixes[i], pathname);
      if (data && data.charAt(0) === '{') {
        try {
          return JSON.parse(data);
        } catch(e) {}
      }
    }
  }

  /**
   * 切割pathname到scope和namespace
   * @param pathname 
   */
  private formatScopeAndNamespace(pathname: string) {
    const sper = pathname.split('/');
    return {
      scope: sper[0],
      namespace: sper[1],
    }
  }

  /**
   * 通过pathname查询
   * @param pathname 
   */
  public findByPathname(
    repository: Repository<PackageEntity>, 
    pathname: string
  ) {
    return repository.createQueryBuilder().where({ pathname }).getOne();
  }

  /**
   * 通过ID查询
   * @param id 
   */
  public findById(
    repository: Repository<PackageEntity>, 
    id: number
  ) {
    return repository.findOne(id);
  }

  /**
   * 通过scope查询
   * @param scope 
   */
  public findByScope(
    repository: Repository<PackageEntity>, 
    scope: string
  ) {
    return repository.createQueryBuilder().where({ scope }).getMany();
  }

  /**
   * 通过scope和name查询
   * @param scope 
   * @param name 
   */
  public findByScopeAndName(
    repository: Repository<PackageEntity>, 
    scope: string, 
    name: string
  ) {
    return repository.createQueryBuilder().where({ scope, name }).getOne();
  }

  /**
   * 插入模块
   * @param pathname 
   * @param uid 
   */
  public async insert(
    repository: Repository<PackageEntity>, 
    pathname: string, 
    uid: UserEntity['id']
  ) {
    let pkg = await this.findByPathname(repository, pathname);
    if (pkg) {
      pkg.utime = new Date();
      return await repository.save(pkg);
    }
    const { scope, namespace } = this.formatScopeAndNamespace(pathname);
    pkg = new PackageEntity();
    pkg.ctime = new Date();
    pkg.name = namespace;
    pkg.userId = uid;
    pkg.pathname = pathname;
    pkg.scope = scope;
    pkg.utime = new Date();
    return await repository.save(pkg);
  }

  /**
   * 删除模块
   * @param id 
   */
  public async delete(
    repository: Repository<PackageEntity>, 
    id: number
  ) {
    const pkg = await this.findById(repository, id);
    if (!pkg) throw new Error('找不到模块');
    return await repository.delete(pkg);
  }
}