import {Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { VersionEntity } from '../version/version.mysql.entity';

@Entity()
@Index(['pid', 'uid'], {
  unique: true,
})
export class DependencyEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
    length: 11,
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
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}