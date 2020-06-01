import { Entity, Column, PrimaryGeneratedColumn, Index, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { PackageEntity } from '../package/package.mysql.entity';
import { DATABASE_NAME } from '../../app.config';
import { UserEntity } from "../user/user.mysql.entity";

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_maintainer',
})
@Index(['pid', 'uid'], {
  unique: true,
})
export class MaintainerEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
  })
  pid: PackageEntity['id'];

  @Column({
    type: 'integer'
  })
  uid: number;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;

  @ManyToOne(type => PackageEntity, packages => packages.Maintainers)
  @JoinColumn({ name: 'pid' })
  Package: PackageEntity;

  @ManyToOne(type => UserEntity, user => user.Maintainers)
  @JoinColumn({ name: 'uid' })
  User: UserEntity
}