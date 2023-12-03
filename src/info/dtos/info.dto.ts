import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const InfoSchema = z.object({
  status: z.string(),
  cheat_version: z.string(),
  loader_version: z.string(),
});

export class InfoDto extends createZodDto(InfoSchema) {}
