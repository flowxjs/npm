import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, Index } from "typeorm";
import { DATABASE_NAME } from '../../app.config';
import { PackageEntity } from "../package/package.mysql.entity";
import { VersionEntity } from "../version/version.mysql.entity";

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_tags',
})
@Index(['pid', 'namespace'], {
  unique: true,
})
@Index(['namespace'])
export class TagEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer'
  })
  pid: number;

  @OneToOne(type => PackageEntity, packages => packages.id)
  @JoinColumn({ name: 'pid' })
  Package: PackageEntity;

  @Column({
    type: 'varchar',
    length: 40,
  })
  namespace: string;

  @Column({
    type: 'integer'
  })
  vid: number;

  @OneToOne(type => VersionEntity, version => version.id)
  @JoinColumn({ name: 'vid' })
  Version: VersionEntity;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}