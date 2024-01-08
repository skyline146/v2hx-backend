import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

import { UserType } from "../enums";

export const AddPlayerSchema = z.object({
  gamertag: z.string(),
  type: z.nativeEnum(UserType),
  reason: z.string(),
});

export class AddPlayerDto extends createZodDto(AddPlayerSchema) {}
