import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

import { UserType } from "../enums";

export const PlayerSchema = z.object({
  id: z.string(),
  xuid: z.string(),
  gamertag: z.string(),
  type: z.nativeEnum(UserType),
  reason: z.string(),
  added_by: z.string(),
});

export class PlayerDto extends createZodDto(PlayerSchema) {}
