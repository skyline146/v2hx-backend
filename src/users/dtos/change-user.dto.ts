import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const ChangeUserSchema = z.object({
  newUsername: z
    .string()
    .regex(/^[A-Za-z0-9_]{3,30}$/, {
      message: "Username must be 3 <= length < 30, contains only a-z, A-Z, 0-9, _",
    })
    .optional(),
  password: z.string().optional(),
  newPassword: z.string().optional(),
});

export class ChangeUserDto extends createZodDto(ChangeUserSchema) {}
