import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm';
import { KeywordEntity } from './keyword.mysql.entity';

@injectable()
export class KeywordService {
  @inject('MySQL') connection: Connection;

  async add(vid: KeywordEntity['vid'], word: KeywordEntity['word']) {
    const repository = this.connection.getRepository(KeywordEntity);
    const keyword = await repository.createQueryBuilder().where({
      vid, word
    }).getOne();
    if (!keyword) {
      const key = new KeywordEntity();
      key.vid = vid;
      key.word = word;
      key.ctime = new Date();
      key.isDeleted = false;
      key.utime = new Date();
      return await repository.save(key);
    }
    if (keyword.isDeleted) {
      keyword.isDeleted = false;
      keyword.utime = new Date();
      return repository.save(keyword);
    }
    return keyword;
  }

  async delete(vid: KeywordEntity['vid']) {
    const repository = this.connection.getRepository(KeywordEntity);
    const [keywords, count] = await repository.createQueryBuilder().where({ 
      vid, isDeleted: false 
    }).getManyAndCount();
    if (!count) return;
    await Promise.all(keywords.map(keyword => {
      keyword.isDeleted = true;
      keyword.utime = new Date();
      return repository.save(keyword);
    }));
  }
}