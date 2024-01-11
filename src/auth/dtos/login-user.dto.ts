import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const LoginUserSchema = z.object({
  username: z.string().regex(/^[A-Za-z0-9_]{3,30}$/, {
    message: "Username must be 3 <= length < 30, contains only a-z, A-Z, 0-9, _",
  }),
  password: z.string(),
  a: z.array(z.number()),
  b: z.array(z.number()).optional(),
  c: z.string(),
});

export class LoginUserDto extends createZodDto(LoginUserSchema) {}
