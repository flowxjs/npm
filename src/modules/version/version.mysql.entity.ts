import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { PackageEntity } from '../package/package.mysql.entity';
import { DATABASE_NAME } from '../../app.config';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_version',
})
@Index(['pid', 'code'], {
  unique: true
})
export class VersionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
  })
  pid: PackageEntity['id'];

  @Column({
    type: 'bool',
  })
  _private: boolean;

  @Column({
    type: 'varchar',
    length: 40,
  })
  code: string;

  @Column({
    type: 'text'
  })
  bugs: string;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    type: 'text',
  })
  homepage: string;

  @Column({
    type: 'varchar',
    length: 10,
  })
  license: string;

  @Column({
    type: 'text',
  })
  readme: string;

  @Column({
    type: 'text',
  })
  repository: string;

  @Column({
    type: 'varchar',
    length: 40,
  })
  shasum: string;

  @Column({
    type: 'text',
  })
  tarball: string;

  @Column({
    type: 'text',
  })
  scripts: string;

  @Column({
    type: 'integer',
  })
  fileCount: number;

  @Column({
    type: 'integer',
  })
  unpackedSize: number;

  @Column({
    type: 'bool',
    default: false,
  })
  isDeleted: boolean;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}