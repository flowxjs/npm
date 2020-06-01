import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { TagEntity } from './tags.mysql.entity';
import { VersionService } from '../version/version.service';
import { VersionEntity } from '../version/version.mysql.entity';

@injectable()
export class TagService {
  @inject(VersionService) private VersionService: VersionService;

  async autoAddMany(
    tagRepository: Repository<TagEntity>, 
    versionRepository: Repository<VersionEntity>,
    pid: TagEntity['pid'],
    distTags: { [key: string]: string }
  ) {
    const pools: TagEntity[] = [];
    for (const key in distTags) {
      const value = distTags[key];
      const version = await this.VersionService.findByPidAndCode(versionRepository, pid, value);
      if (!version) continue;
      pools.push(await this.add(tagRepository, version.id, pid, key));
    }
    return pools;
  }
  
  async add(
    repository: Repository<TagEntity>, 
    vid: TagEntity['vid'], 
    pid: TagEntity['pid'],
    namespace: TagEntity['namespace']
  ) {
    const tags = await repository.createQueryBuilder().where({
      pid, namespace
    }).getOne();
    if (!tags) {
      const tag = new TagEntity();
      tag.vid = vid;
      tag.pid = pid;
      tag.ctime = new Date();
      tag.utime = new Date();
      tag.namespace = namespace;
      return await repository.save(tag);
    }
    tags.vid = vid;
    tags.utime = new Date();
    return await repository.save(tags);
  }

}