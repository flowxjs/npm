import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, Index, ManyToOne } from "typeorm";
import { DATABASE_NAME } from '../../app.config';
import { PackageEntity } from "../package/package.mysql.entity";

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
    type: 'integer',
  })
  pid: number;

  @Column({
    type: 'varchar',
    length: 40,
  })
  namespace: string;

  @Column({
    type: 'integer'
  })
  vid: number;

  @Column({
    type: 'datetime',
  })
  ctime: Date;

  @Column({
    type: 'datetime',
  })
  utime: Date;

  @ManyToOne(type => PackageEntity, packages => packages.Tags)
  @JoinColumn({ name: 'pid' })
  Package: PackageEntity;
}