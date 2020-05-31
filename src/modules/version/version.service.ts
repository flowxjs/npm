import { injectable, inject } from 'inversify';
import { Connection } from 'typeorm';
import { VersionEntity } from './version.mysql.entity';

@injectable()
export class VersionService {
  @inject('MySQL') connection: Connection;

  async add(data: any) {
    
  }
}