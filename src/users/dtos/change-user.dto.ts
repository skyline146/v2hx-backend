import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const ChangeUsernameSchema = z.object({
  newUsername: z.string().regex(/^[A-Za-z0-9_]{3,30}$/, {
    message: "Username must be 3 <= length < 30, contains only a-z, A-Z, 0-9, _",
  }),
});

const ChangePasswordSchema = z.object({
  password: z.string(),
  newPassword: z.string(),
});

export class ChangeUsernameDto extends createZodDto(ChangeUsernameSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
