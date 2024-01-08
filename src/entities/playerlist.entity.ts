import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

import { UserType } from "src/playerlist/enums";

@Entity()
export class Playerlist {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  xuid: string;

  @Column({ default: "" })
  gamertag: string;

  @Column({ type: "enum", enum: UserType, default: UserType.Player })
  type: UserType;

  @Column({ default: "" })
  reason: string;

  @Column({ default: "" })
  added_by: string;
}
