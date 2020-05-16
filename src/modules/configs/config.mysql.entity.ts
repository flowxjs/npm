import { Entity, Column, PrimaryGeneratedColumn, Index } from "typeorm";
import { DATABASE_NAME } from '../../app.config';

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_configs',
})
export class ConfigEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'bool'
  })
  // 网站是否关闭
  close: boolean;

  @Column({
    type: 'text',
  })
  // 公有源列表
  registries: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  // 本服务域名
  domain: string;

  @Column({
    type: 'integer',
  })
  // 包缓存事件
  packageCacheExpireTime: number;

  @Column({
    type: 'text'
  })
  // 登入类型
  loginType: string;

  @Column({
    type: 'text',
  })
  // scope组列表
  scopes: string;
}