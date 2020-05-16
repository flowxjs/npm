import {Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { VersionEntity } from '../version/version.mysql.entity';

@Entity()
@Index(['pid', 'uid'], {
  unique: true,
})
export class KeywrodEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
    length: 11,
  })
  vid: VersionEntity['id'];

  @Column({
    type: 'varchar',
    length: 40,
  })
  word: string;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}