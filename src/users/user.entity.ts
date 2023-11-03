import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Length } from "class-validator";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  @Length(3, 50)
  username: string;

  @Column()
  password: string;

  @Column({ default: "" })
  hdd: string;

  @Column({ default: "" })
  mac_adress: string;

  @Column({ default: "" })
  last_hdd: string;

  @Column({ default: "" })
  last_mac_adress: string;

  @Column({ default: 0 })
  expire_date: Date;

  @Column({ default: 0 })
  last_entry_date: Date;

  @Column({ default: 0 })
  warn: number;

  @Column({ default: false })
  ban: boolean;

  @Column({ default: false })
  admin: boolean;
}
