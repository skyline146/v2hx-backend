import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Info {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  version: string;

  @Column()
  status: string;
}
