import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { VersionEntity } from './version.mysql.entity';
import { PackageEntity } from '../package/package.mysql.entity';
import { v4 } from 'uuid';
import { DATABASE_NAME } from '../../app.config';
import { DependenciesService } from '../dependencies/dependencies.service';
import { KeywordService } from '../keywords/keyword.service';
import { DependencyEntity } from '../dependencies/dependency.mysql.entity';
import { KeywordEntity } from '../keywords/keyword.mysql.entity';

interface TVersionCompareTree {
  items?: {
    [id:string]: TVersionCompareTree
  },
  max: number,
}

@injectable()
export class VersionService {
  @inject('MySQL') private connection: Connection;
  @inject(DependenciesService) private DependenciesService: DependenciesService;
  @inject(KeywordService) private KeywordService: KeywordService;

  findByPidAndCode(
    repository: Repository<VersionEntity>,
    pid: number,
    code: string
  ) {
    return repository.createQueryBuilder().where({
      pid, code
    }).getOne();
  } 

  findVersionsByPid(
    repository: Repository<VersionEntity>, 
    pid: PackageEntity['id']
  ) {
    return repository.createQueryBuilder().where({
      pid,
    }).getMany();
  }

  async insert(
    versionRepository: Repository<VersionEntity>, 
    uid: number,
    pid: number,
    code: string,
    bugs: string,
    description: string,
    homepage: string,
    license: string,
    readme: string,
    repository: string,
    shasum: string,
    tarball: string,
    integrity: string,
    size: number,
  ) {
    const version = new VersionEntity();
    version.uid = uid;
    version.pid = pid;
    version.ctime = new Date();
    version.description = description;
    version.homepage = homepage;
    version.integrity = integrity;
    version.license = license;
    version.readme = readme;
    version.repository = repository;
    version.shasum = shasum;
    version.tarball = tarball;
    version.utime = new Date();
    version.bugs = bugs;
    version.code = code;
    version.deprecated = '';
    version.rev = v4();
    version.attachment_size = size;
    const _version = await versionRepository.save(version);
    _version.Dependencies = [];
    _version.Keywords = [];
    return _version;
  }

  /**
   * 检测当前版本是否可以提交发布
   * @param repository 
   * @param pid 
   * @param version 
   */
  async canVersionPublish(
    repository: Repository<VersionEntity>, 
    pid: PackageEntity['id'],
    version: string,
  ) {
    const versionEntities = await this.findVersionsByPid(repository, pid);
    const versions = versionEntities.map(ver => ver.code);
    const root: TVersionCompareTree = {
      items: {}, // 1
      max: 0,
    };
    versions.forEach(ver => {
      const sp = ver.split('.').map(Number);
      const MAJOR = sp[0];
      const MINOR = sp[1];
      const PATCH = sp[2];

      if (!root.items[MAJOR]) root.items[MAJOR] = {
        items: {},// 2
        max: 0,
      }
      if (MAJOR > root.max) root.max = MAJOR;
      if (!root.items[MAJOR].items[MINOR]) root.items[MAJOR].items[MINOR] = {
        items: {},// 3
        max: 0,
      }
      if (MINOR > root.items[MAJOR].max) root.items[MAJOR].max = MINOR;
      if (PATCH > root.items[MAJOR].items[MINOR].max) root.items[MAJOR].items[MINOR].max = PATCH;
    });
    const sp = version.split('.').map(Number);
    const MAJOR = sp[0];
    const MINOR = sp[1];
    const PATCH = sp[2];

    if (root.items[MAJOR]) {
      const a = root.items[MAJOR];
      if (a.items[MINOR]) {
        const b = a.items[MINOR];
        if (b.max < PATCH) return true;
      } else {
        if (a.max < MINOR) return true;
      }
    } else {
      if (root.max < MAJOR) return true;
    }
  }

  async delete(
    versionRepository: Repository<VersionEntity>,
    dependencyRepository: Repository<DependencyEntity>,
    keywordRepository: Repository<KeywordEntity>,
    vid: number,
  ) {
    await Promise.all([
      this.DependenciesService.delete(dependencyRepository, vid),
      this.KeywordService.delete(keywordRepository, vid)
    ]);
    return await versionRepository.delete(vid);
  }

  findLatestVersion(versionRepository: Repository<VersionEntity>) {
    return versionRepository.createQueryBuilder().orderBy('utime', 'DESC').getOne();
  }

  findLatestVersionExculeVid(
    versionRepository: Repository<VersionEntity>,
    vid: number
  ) {
    return versionRepository.createQueryBuilder().where('id<>:vid', { vid }).orderBy('utime', 'DESC').getOne();
  }
}