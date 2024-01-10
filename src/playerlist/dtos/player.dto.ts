import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

import { UserType } from "../enums";

export const PlayerSchema = z.object({
  gamertag: z.string(),
  type: z.nativeEnum(UserType),
  reason: z.string(),
});

export const PlayerRowSchema = z
  .object({
    id: z.string(),
    xuid: z.string(),
    added_by: z.string(),
  })
  .merge(PlayerSchema);

export class PlayerRowDto extends createZodDto(PlayerRowSchema) {}
export class PlayerDto extends createZodDto(PlayerSchema) {}
