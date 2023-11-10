import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Info {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: string;

  @Column()
  cheat_version: string;

  @Column()
  loader_version: string;
}
