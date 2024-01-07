import { FastifyRequest as Request } from "fastify";
import { UserRowDto } from "./users/dtos";

declare module "fastify" {
  interface FastifyRequest extends Request {
    user: UserRowDto;
    xbox_user: {
      user_hash: string;
      xsts_token: string;
    };
  }
}
