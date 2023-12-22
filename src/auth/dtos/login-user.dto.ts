import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const LoginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  a: z.array(z.number()),
  b: z.array(z.number()),
});

export class LoginUserDto extends createZodDto(LoginUserSchema) {}
