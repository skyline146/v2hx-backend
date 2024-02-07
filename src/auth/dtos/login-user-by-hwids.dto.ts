import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const LoginUserByHwidsSchema = z.object({
  a: z.array(z.number()),
  b: z.array(z.number()).optional(),
  c: z.string(),
});

export class LoginUserByHwidsDto extends createZodDto(LoginUserByHwidsSchema) {}
