import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const GetUsersQuerySchema = z.object({
  page: z
    .string()
    .transform((value) => +value)
    .refine((value) => typeof value === "number" && value > 0, {
      message: "page must be a number greater than 0.",
    }),
  search_value: z.string().optional(),
  filter: z
    .string()
    .refine((value) => ["online", "active_subscription"].includes(value), {
      message: `online must be a string "online" or "active_subscription".`,
    })
    .optional(),
});

export class GetUsersQueryDto extends createZodDto(GetUsersQuerySchema) {}
