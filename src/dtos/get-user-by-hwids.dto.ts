import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

const GetUserByHwidsSchema = z.object({ hwid1: z.string(), hwid2: z.string() });

export class GetUserByHwidsDto extends createZodDto(GetUserByHwidsSchema) {}
