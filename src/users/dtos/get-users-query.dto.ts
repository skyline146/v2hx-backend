import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const GetUsersQuerySchema = z.object({
  page: z.string(),
  search_value: z.string().optional(),
});

export class GetUsersQueryDto extends createZodDto(GetUsersQuerySchema) {}
