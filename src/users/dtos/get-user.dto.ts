import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const GetUserByHwidsSchema = z.object({
  a: z.string(),
  b: z.string(),
  c: z.string(),
});

const GetUserSchema = z.object({ username: z.string() }).merge(GetUserByHwidsSchema);

export class GetUserByHwidsDto extends createZodDto(GetUserByHwidsSchema) {}
export class GetUserDto extends createZodDto(GetUserSchema) {}
