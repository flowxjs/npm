import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { DATABASE_NAME } from '../../app.config';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_configs',
})
export class ConfigEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'bool',
    default: false
  })
  // 网站是否关闭
  close: boolean;

  @Column({
    type: 'text'
  })
  // 公有源列表
  registries: string;

  @Column({
    type: 'text',
  })
  // 本服务域名
  domain: string;

  @Column({
    type: 'integer',
    default: -1
  })
  // 包缓存事件
  packageCacheExpireTime: number;

  @Column({
    type: 'integer',
    default: 0
  })
  // 登入类型
  loginType: number;

  @Column({
    type: 'text',
  })
  // scope组列表
  scopes: string;
}