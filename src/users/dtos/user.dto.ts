import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const UserSchema = z.object({
  username: z.string(),
  admin: z.boolean(),
  expire_date: z.string(),
  invitation_code: z.string(),
  code_activations: z.number(),
  is_code_activated: z.boolean(),
});

export class UserDto extends createZodDto(UserSchema) {}
