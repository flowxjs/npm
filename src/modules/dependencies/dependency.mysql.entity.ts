import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { VersionEntity } from '../version/version.mysql.entity';
import { DATABASE_NAME } from '../../app.config';
import { PackageEntity } from '../package/package.mysql.entity';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_dependency',
})
@Index(['vid', 'pathname', 'type'], {
  unique: true,
})
export class DependencyEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
  })
  vid: VersionEntity['id'];

  @Column({
    type: 'varchar',
    length: 8,
  })
  // https://www.jianshu.com/p/511775598b2b
  // dependencies: null
  // devDependencies: dev
  // peerDependencies: peer
  // optionalDependencies: optional
  // bundledDenpendencies: bundled
  type: 'dev' | 'peer' | 'optional' | 'bundled' | null;

  @Column({
    type: 'varchar',
    length: 255,
  })
  pathname: PackageEntity['pathname'];

  @Column({
    type: 'varchar',
    length: 100,
  })
  version: VersionEntity['code'];

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}