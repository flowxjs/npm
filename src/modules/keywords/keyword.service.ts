import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { KeywordEntity } from './keyword.mysql.entity';

@injectable()
export class KeywordService {
  @inject('MySQL') connection: Connection;

  async autoAddMany(
    repository: Repository<KeywordEntity>, 
    vid: KeywordEntity['vid'], 
    words: KeywordEntity['word'][],
  ) {
    const pools: KeywordEntity[] = [];
    for (let i = 0; i < words.length; i++) {
      pools.push(await this.add(repository, vid, words[i]));
    }
    return pools;
  }

  async add(
    repository: Repository<KeywordEntity>, 
    vid: KeywordEntity['vid'], 
    word: KeywordEntity['word'],
  ) {
    const keyword = await repository.createQueryBuilder().where({
      vid, word
    }).getOne();
    if (!keyword) {
      const key = new KeywordEntity();
      key.vid = vid;
      key.word = word;
      key.ctime = new Date();
      key.utime = new Date();
      return await repository.save(key);
    }
    return keyword;
  }

  async delete(
    repository: Repository<KeywordEntity>, 
    vid: KeywordEntity['vid']
  ) {
    const [keywords, count] = await repository.createQueryBuilder().where({ 
      vid
    }).getManyAndCount();
    if (!count) return;
    await Promise.all(keywords.map(keyword => repository.delete(keyword)));
  }
}