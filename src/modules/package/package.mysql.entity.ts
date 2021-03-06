import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, JoinColumn } from "typeorm";
import { UserEntity } from '../user/user.mysql.entity';
import { DATABASE_NAME } from '../../app.config';
import { VersionEntity } from "../version/version.mysql.entity";
import { MaintainerEntity } from "../maintainer/maintainer.mysql.entity";
import { TagEntity } from "../tags/tags.mysql.entity";

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_package',
})
@Index(['scope', 'name'])
export class PackageEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  scope: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 101,
    unique: true,
  })
  pathname: string;

  @Column({
    type: 'integer',
  })
  uid: UserEntity['id'];

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;

  @OneToMany(type => VersionEntity, version => version.Package)
  Versions: VersionEntity[];

  @OneToMany(type => TagEntity, tag => tag.Package)
  Tags: TagEntity[];

  @OneToMany(type => MaintainerEntity, maintainer => maintainer.Package)
  Maintainers: MaintainerEntity[];
}