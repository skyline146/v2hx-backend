import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const GetPlayerByGamertagSchema = z.object({
  gamertag: z.string(),
});

export const GetPlayerByXUIDSchema = z.object({
  xuid: z.string(),
});

export const GetPlayersByXUIDsSchema = z.object({
  xuids: z.array(z.string()),
});

export class GetPlayerByGamertagDto extends createZodDto(GetPlayerByGamertagSchema) {}
export class GetPlayerByXUIDDto extends createZodDto(GetPlayerByXUIDSchema) {}
export class GetPlayersByXUIDsDto extends createZodDto(GetPlayersByXUIDsSchema) {}
