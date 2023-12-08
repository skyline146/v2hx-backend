import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const GetUserByHwidsSchema = z.object({ hwid1: z.string(), hwid2: z.string() });
const GetUserSchema = z.object({ username: z.string() }).merge(GetUserByHwidsSchema);

export class GetUserByHwidsDto extends createZodDto(GetUserByHwidsSchema) {}
export class GetUserDto extends createZodDto(GetUserSchema) {}
