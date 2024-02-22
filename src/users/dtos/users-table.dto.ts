import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

import { UserSchema } from "./user.dto";

const UserRowSchema = z
  .object({
    last_entry_date: z.string(),
    discord_id: z.string(),
    hdd: z.string(),
    last_hdd: z.string(),
    mac_address: z.string(),
    last_mac_address: z.string(),
    ip: z.string(),
    last_ip: z.string(),
    warn: z.number(),
    ban: z.boolean(),
    online: z.boolean(),
    private_access: z.boolean(),
  })
  .merge(UserSchema);

const UsersTableSchema = z.object({
  total: z.number(),
  users: z.array(UserRowSchema),
});

export class UserRowDto extends createZodDto(UserRowSchema) {}
export class UsersTableDto extends createZodDto(UsersTableSchema) {}
