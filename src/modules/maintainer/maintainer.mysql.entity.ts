import { Entity, Column, PrimaryGeneratedColumn, Index, OneToOne, JoinColumn } from "typeorm";
import { UserEntity } from '../user/user.mysql.entity';
import { PackageEntity } from '../package/package.mysql.entity';
import { DATABASE_NAME } from '../../app.config';

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

  @OneToOne(type => PackageEntity, packages => packages.id)
  @JoinColumn({ name: 'pid' })
  Package: PackageEntity

  @Column({
    type: 'integer'
  })
  uid: number;

  @OneToOne(type => UserEntity, user => user.id)
  @JoinColumn({ name: 'uid' })
  User: UserEntity;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}