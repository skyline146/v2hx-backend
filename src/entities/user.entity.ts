import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Length } from "class-validator";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  @Length(3, 50)
  username: string;

  @Column({ default: "" })
  discord_id: string;

  // @Column("text", { array: true, default: [] })
  // usernames_history: string[];

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

  @Column({ default: "" })
  last_entry_date: string;

  @Column({ default: "" })
  ip: string;

  @Column({ default: "" })
  last_ip: string;

  @Column({ default: false })
  online: boolean;

  // @Column({ default: "" })
  // socket_id: string;

  @Column({ default: 0 })
  warn: number;

  @Column({ default: false })
  ban: boolean;

  @Column({ default: false })
  admin: boolean;
}
