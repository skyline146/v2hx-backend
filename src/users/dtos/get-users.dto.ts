import { UserSchema } from "./user.dto";
import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const UserRowSchema = z
  .object({
    last_entry_date: z.string(),
    discord_username: z.string(),
    hdd: z.string(),
    last_hdd: z.string(),
    mac_address: z.string(),
    last_mac_address: z.string(),
    warn: z.number(),
    ban: z.boolean(),
  })
  .merge(UserSchema);

const UsersTableSchema = z.object({
  total: z.number(),
  users: z.array(UserRowSchema),
});

export class UserRowDto extends createZodDto(UserRowSchema) {}
export class UsersTableDto extends createZodDto(UsersTableSchema) {}
