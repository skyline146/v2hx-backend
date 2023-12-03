import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const UserSchema = z.object({
  username: z.string(),
  admin: z.boolean(),
  expire_date: z.string(),
});

export class UserDto extends createZodDto(UserSchema) {}
