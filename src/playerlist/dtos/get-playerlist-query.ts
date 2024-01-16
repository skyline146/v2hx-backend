import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const GetPlayerlistQuerySchema = z.object({
  page: z.string(),
  search_value: z.string().optional(),
});

export class GetPlayerlistQueryDto extends createZodDto(GetPlayerlistQuerySchema) {}
