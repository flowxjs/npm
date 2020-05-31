import { Entity, Column, PrimaryGeneratedColumn, Index, OneToOne, JoinColumn } from "typeorm";
import { VersionEntity } from '../version/version.mysql.entity';
import { DATABASE_NAME } from '../../app.config';
import { PackageEntity } from '../package/package.mysql.entity';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_dependency',
})
@Index(['vid', 'pathname', 'value', 'type'], {
  unique: true,
})
export class DependencyEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
  })
  vid: VersionEntity['id'];

  @OneToOne(type => VersionEntity, version => version.id)
  @JoinColumn({ name: 'vid' })
  Version: VersionEntity;

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
  value: VersionEntity['code'];

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}