import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const OffsetsSchema = z.object({
  version: z.enum(["steam", "uwp"]),
});

export class OffsetsDto extends createZodDto(OffsetsSchema) {}
