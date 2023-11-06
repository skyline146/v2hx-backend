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
  mac_address: string;

  @Column({ default: "" })
  last_hdd: string;

  @Column({ default: "" })
  last_mac_address: string;

  @Column({ default: "" })
  expire_date: string;

  @Column({ default: 0 })
  last_entry_date: Date;

  @Column({ default: 0 })
  warn: number;

  @Column({ default: false })
  ban: boolean;

  @Column({ default: false })
  admin: boolean;
}
