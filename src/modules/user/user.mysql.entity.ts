import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { DATABASE_NAME } from '../../app.config';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_user',
})
@Index(['account', 'referer'], {
  unique: true,
})
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  account: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  nickname: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  email: string;

  @Column({
    type: 'text',
  })
  avatar: string;

  @Column({
    type: 'varchar',
    length: 5,
  })
  salt: string;

  @Column({
    type: 'varchar',
    length: 40,
  })
  password: string;

  @Column({
    type: 'integer',
    default: 0
  })
  // 来源
  referer: number;

  @Column({
    type: 'integer',
    default: 1,
  })
  // default: 1; 0: 禁止登陆, 1: 正常登陆
  status: number;

  @Column({
    type: 'bool',
    default: false,
  })
  // 是否为管理员
  isAdmin: boolean;

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