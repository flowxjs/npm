import { injectable, inject } from 'inversify';
import { Connection, Repository } from 'typeorm';
import { KeywordEntity } from './keyword.mysql.entity';

@injectable()
export class KeywordService {
  @inject('MySQL') connection: Connection;

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
      vid, isDeleted: false 
    }).getManyAndCount();
    if (!count) return;
    await Promise.all(keywords.map(keyword => repository.delete(keyword)));
  }
}