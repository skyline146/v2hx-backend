import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const ChangeUserSchema = z.object({
  newUsername: z.string().min(3).max(30).optional(),
  password: z.string().optional(),
  newPassword: z.string().optional(),
});

export class ChangeUserDto extends createZodDto(ChangeUserSchema) {}
