import request from 'request';
import url from 'url';
import path from 'path';
import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { DATABASE_NAME, DOMAIN } from '../../app.config';
import { UserEntity } from '../user/user.mysql.entity';
import { PackageEntity } from './package.mysql.entity';
import { VersionEntity } from '../version/version.mysql.entity';
import { cacheable } from '@flowx/redis';
import { TPackageInfomation, TPackageVersions } from './package.dto';
import { NotFoundException } from '@flowx/http';

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
      if (typeof data === 'object') return data;
      if (data && (data as string).charAt(0) === '{') {
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
      return await this.getInfo(repository, await repository.save(pkg));
    }
    const { scope, namespace } = this.formatScopeAndNamespace(pathname);
    pkg = new PackageEntity();
    pkg.ctime = new Date();
    pkg.name = namespace;
    pkg.uid = uid;
    pkg.pathname = pathname;
    pkg.scope = scope;
    pkg.utime = new Date();
    pkg = await repository.save(pkg);
    pkg.Versions = [];
    pkg.Tags = [];
    pkg.Maintainers = [];
    return pkg;
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

  private getInfo(
    packageRepository: Repository<PackageEntity>,
    pkg: PackageEntity
  ) {
    return packageRepository.createQueryBuilder(DATABASE_NAME + '_package')
      .leftJoinAndSelect(DATABASE_NAME + '_package.Versions', DATABASE_NAME + '_version')
      .leftJoinAndSelect(DATABASE_NAME + '_package.Tags', DATABASE_NAME + '_tags')
      .leftJoinAndSelect(DATABASE_NAME + '_package.Maintainers', DATABASE_NAME + '_maintainer')
      .where({ id: pkg.id })
      .andWhere(DATABASE_NAME + '_version.pid=' + DATABASE_NAME + '_package.id')
      .andWhere(DATABASE_NAME + '_tags.pid=' + DATABASE_NAME + '_package.id')
      .andWhere(DATABASE_NAME + '_maintainer.pid=' + DATABASE_NAME + '_package.id')
      .getOne();
  }

  @cacheable('package:${1}:${2}')
  public async info(
    packageRepository: Repository<PackageEntity>,
    scope: string, 
    pkgname: string,
  ) {
    const result = await packageRepository.createQueryBuilder(DATABASE_NAME + '_package')
      .leftJoinAndSelect(DATABASE_NAME + '_package.Versions', DATABASE_NAME + '_version')
      .leftJoinAndSelect(DATABASE_NAME + '_package.Tags', DATABASE_NAME + '_tags')
      .leftJoinAndSelect(DATABASE_NAME + '_package.Maintainers', DATABASE_NAME + '_maintainer')
      .leftJoinAndSelect(DATABASE_NAME + '_version.Dependencies', DATABASE_NAME + '_dependency')
      .leftJoinAndSelect(DATABASE_NAME + '_version.Keywords', DATABASE_NAME + '_keyword')
      .leftJoinAndSelect(DATABASE_NAME + '_maintainer.User', DATABASE_NAME + '_user')
      .where({ scope, name: pkgname })
      .andWhere(DATABASE_NAME + '_version.pid=' + DATABASE_NAME + '_package.id')
      .andWhere(DATABASE_NAME + '_tags.pid=' + DATABASE_NAME + '_package.id')
      .andWhere(DATABASE_NAME + '_maintainer.pid=' + DATABASE_NAME + '_package.id')
      .andWhere(DATABASE_NAME + '_keyword.vid=' + DATABASE_NAME + '_version.id')
      .andWhere(DATABASE_NAME + '_dependency.vid=' + DATABASE_NAME + '_version.id')
      .andWhere(DATABASE_NAME + '_maintainer.uid=' + DATABASE_NAME + '_user.id')
      .getOne();
    return this.parsePackageInfo(result);
  }

  private parsePackageInfo(data: PackageEntity) {
    if (!data) throw new NotFoundException('您所查询的模块不存在');
    const [userObject, userArray] = this.parseMaintainers(data.Maintainers);
    const [versions, maps, time] = this.parseVersions(data.pathname, data.uid, userObject, data.Versions);
    const tags = this.parseTags(data.Tags, maps);
    const version = versions[tags['latest']];
    const readme = version.readme;
    time.created = data.ctime;
    time.modified = data.utime;
    return {
      author: version.author,
      maintainers: userArray,
      versions: this.removeReadme(versions),
      ['dist-tags']: tags,
      bugs: version.bugs,
      description: version.description,
      homepage: version.homepage,
      keywords: version.keywords,
      license: version.license,
      name: version.name,
      readme,
      repository: version.repository,
      _id: data.pathname,
      _rev: version._rev,
      _npmUser: version.author,
      time,
    };
  }

  private parseMaintainers(maintainers: PackageEntity['Maintainers']): [
    { [uid: string]: { name: string, email: string } },
    { name: string, email: string }[]
  ] {
    const userObject: { [uid: string]: { name: string, email: string } } = {};
    const userArray: { name: string, email: string }[] = [];
    for (let i = 0; i < maintainers.length; i++) {
      const maintainer = maintainers[i];
      if (!userObject[maintainer.uid]) {
        userObject[maintainer.uid] = {
          name: maintainer.User.account,
          email: maintainer.User.email,
        }
        userArray.push(userObject[maintainer.uid]);
      }
    }
    return [userObject, userArray];
  }

  private parseVersions(
    pathname: string,
    owner: number,
    userObject: { [uid: string]: { name: string, email: string } },
    versions: PackageEntity['Versions']
  ): [
    { [version: string]: TPackageInfomation }, 
    TPackageVersions, 
    { [version: string]: Date } 
  ] {
    const res: { [version: string]: TPackageInfomation } = {};
    const maps: TPackageVersions = {};
    const time: {[version: string]: Date} = {};
    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      const bugs = JSON.parse(version.bugs);
      const deps = this.parseDependencies(version.Dependencies);
      time[version.code] = version.utime;
      res[version.code] = Object.assign({
        _id: pathname + '@' + version.code,
        name: pathname,
        author: userObject[version.uid],
        maintainers: owner === version.uid ? [userObject[version.uid]] : [userObject[owner], userObject[version.uid]],
        bugs: typeof bugs === 'object' ? { url: bugs.url } : { url: bugs },
        description: version.description,
        homepage: version.homepage,
        keywords: version.Keywords.map(keyword => keyword.word),
        license: version.license,
        readme: version.readme,
        repository: JSON.parse(version.repository),
        version: version.code,
        _rev: version.rev,
        dist: {
          integrity: version.integrity,
          shasum: version.shasum,
          tarball: url.resolve(DOMAIN, path.join('/-/download', '.', version.tarball)),
        }
      }, deps);
      maps[version.id] = version.code;
    }
    return [res, maps, time];
  }

  private parseDependencies(dependencies: VersionEntity['Dependencies']) {
    const res: {
      dependencies?: TPackageInfomation['dependencies'],
      devDependencies?: TPackageInfomation['devDependencies'],
      peerDependencies?: TPackageInfomation['peerDependencies'],
      optionalDependencies?: TPackageInfomation['optionalDependencies'],
      bundledDenpendencies?: TPackageInfomation['bundledDenpendencies'],
    } = {};
    for (let i = 0; i < dependencies.length; i++) {
      const dependency = dependencies[i];
      switch (dependency.type) {
        case 'bundled': 
          if (!res.bundledDenpendencies) res.bundledDenpendencies = {};
          res.bundledDenpendencies[dependency.pathname] = dependency.value;
          break;
        case 'dev':
          if (!res.devDependencies) res.devDependencies = {};
          res.devDependencies[dependency.pathname] = dependency.value;
          break;
        case 'optional':
          if (!res.optionalDependencies) res.optionalDependencies = {};
          res.optionalDependencies[dependency.pathname] = dependency.value;
          break;
        case 'peer':
          if (!res.peerDependencies) res.peerDependencies = {};
          res.peerDependencies[dependency.pathname] = dependency.value;
          break;
        default:
          if (!res.dependencies) res.dependencies = {};
          res.dependencies[dependency.pathname] = dependency.value;
      }
    }
    return res;
  }

  private parseTags(tags: PackageEntity['Tags'], versions: TPackageVersions) {
    const tagObject: {[namespace: string]: string} = {};
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      tagObject[tag.namespace] = versions[tag.vid];
    }
    return tagObject;
  }

  private removeReadme(versions: {[key: string]: TPackageInfomation}) {
    for (const i in versions) {
      if (versions[i].readme) {
        Reflect.deleteProperty(versions[i], 'readme');
      }
    }
    return versions;
  }

  async findPidByScopeAndPkgName(
    packageRepository: Repository<PackageEntity>,
    scope: string, pkgname: string
  ) {
    const Package = await packageRepository.createQueryBuilder().where({
      scope, name: pkgname
    }).getOne();
    return Package ? Package.id : 0;
  }
}