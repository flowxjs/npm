import {Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { UserEntity } from '../user/user.mysql.entity';

@Entity()
@Index(['scope', 'name'], {
  unique: true,
})
export class PackageEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  scope: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'integer',
    length: 11,
  })
  owner: UserEntity['id'];

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}