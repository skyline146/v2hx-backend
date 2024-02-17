import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const EmitClientEventSchema = z.object({
  event: z.string(),
  data: z.any().optional(),
});

export class EmitClientEventDto extends createZodDto(EmitClientEventSchema) {}
