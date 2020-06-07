import { Entity, Column, PrimaryGeneratedColumn, Index, OneToOne, OneToMany } from "typeorm";
import { DATABASE_NAME } from '../../app.config';
import { MaintainerEntity } from "../maintainer/maintainer.mysql.entity";

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

  openid: string;
  unionid: string;

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
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;

  @OneToMany(type => MaintainerEntity, maintainer => maintainer.User)
  Maintainers: MaintainerEntity[];
}