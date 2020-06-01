import { Entity, Column, PrimaryGeneratedColumn, Index, OneToOne, JoinColumn, OneToMany, ManyToOne } from "typeorm";
import { PackageEntity } from '../package/package.mysql.entity';
import { DATABASE_NAME } from '../../app.config';
import { DependencyEntity } from "../dependencies/dependency.mysql.entity";
import { KeywordEntity } from "../keywords/keyword.mysql.entity";

@Entity({
  synchronize: true,
  name: DATABASE_NAME + '_version',
})
@Index(['pid', 'code'], {
  unique: true
})
@Index(['code'])
export class VersionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
    nullable: true,
  })
  pid: PackageEntity['id'];

  @Column({
    type: 'varchar',
    length: 40,
  })
  code: string;

  @Column({
    type: 'text'
  })
  bugs: string;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    type: 'text',
  })
  homepage: string;

  @Column({
    type: 'varchar',
    length: 10,
  })
  license: string;

  @Column({
    type: 'text',
  })
  readme: string;

  @Column({
    type: 'text',
  })
  repository: string;

  @Column({
    type: 'varchar',
    length: 40,
  })
  shasum: string;

  @Column({
    type: 'text',
  })
  tarball: string;

  @Column({
    type: 'text',
  })
  integrity: string;

  @Column({
    type: 'text',
  })
  attachment_data: string;

  @Column({
    type: 'integer',
    default: 0,
  })
  attachment_size: number;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;

  @ManyToOne(type => PackageEntity, packages => packages.Versions)
  @JoinColumn({ name: 'pid' })
  Package: PackageEntity;

  @OneToMany(type => DependencyEntity, dep => dep.Version)
  Dependencies: DependencyEntity[];

  @OneToMany(type => KeywordEntity, keyword => keyword.Version)
  Keywords: KeywordEntity[];
}