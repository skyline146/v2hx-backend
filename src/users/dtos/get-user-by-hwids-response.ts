import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const GetUserByHwidsResponseSchema = z.object({
  username: z.string(),
  expire_date: z.string(),
  ban: z.boolean(),
  online: z.boolean(),
});

export class GetUserByHwidsResponseDto extends createZodDto(GetUserByHwidsResponseSchema) {}
