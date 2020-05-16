import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { PackageEntity } from '../package/package.mysql.entity';

@Entity()
@Index([], {})
export class VersionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
    length: 11,
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
    length: 11,
  })
  fileCount: number;

  @Column({
    type: 'integer',
    length: 15,
  })
  unpackedSize: number;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}