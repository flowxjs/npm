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
export class VersionEntity {
  @PrimaryGeneratedColumn()
  @OneToOne(type => DependencyEntity, dep => dep.vid)
  @OneToOne(type => KeywordEntity, keyword => keyword.vid)
  public id: number;

  @Column({
    type: 'integer',
  })
  pid: PackageEntity['id'];

  @OneToOne(type => PackageEntity, packages => packages.id)
  @JoinColumn({ name: 'pid' })
  package: PackageEntity

  @Column({
    type: 'bool',
  })
  _private: boolean;

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
  scripts: string;

  @Column({
    type: 'text',
  })
  integrity: string;

  @Column({
    type: 'text',
  })
  attachment_data: string;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;
}