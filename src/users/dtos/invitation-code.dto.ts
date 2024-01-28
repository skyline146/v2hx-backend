import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";

export const InvitationCodeSchema = z.object({
  code: z.string().min(1),
});

export class InvitationCodeDto extends createZodDto(InvitationCodeSchema) {}
