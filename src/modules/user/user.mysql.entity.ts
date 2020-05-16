import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { DATABASE_NAME } from '../../app.config';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_user',
})
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
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
    length: 40,
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  // 来源
  referer: string

  @Column({
    type: 'integer',
  })
  // default: 1; 0: 禁止登陆, 1: 正常登陆
  status: number;

  @Column({
    type: 'bool',
  })
  // 是否为管理员
  isAdmin: boolean;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}