import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const LoginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  hwid1: z.string(),
  hwid2: z.string(),
});

export class LoginUserDto extends createZodDto(LoginUserSchema) {}
