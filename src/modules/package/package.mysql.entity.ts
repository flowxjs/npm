import { Entity, Column, PrimaryGeneratedColumn, Index, OneToOne, JoinColumn } from "typeorm";
import { UserEntity } from '../user/user.mysql.entity';
import { DATABASE_NAME } from '../../app.config';
import { VersionEntity } from "../version/version.mysql.entity";
import { MaintainerEntity } from "../maintainer/maintainer.mysql.entity";

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_package',
})
@Index(['scope', 'name'])
@Index(['pathname'])
export class PackageEntity {
  @PrimaryGeneratedColumn()
  @OneToOne(type => VersionEntity, version => version.pid)
  @OneToOne(type => MaintainerEntity, maintainer => maintainer.pid)
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
    type: 'varchar',
    length: 255,
    unique: true,
  })
  pathname: string;

  @Column({
    type: 'integer',
  })
  userId: UserEntity['id'];

  @OneToOne(type => UserEntity, user => user.id)
  @JoinColumn()
  user: UserEntity;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}