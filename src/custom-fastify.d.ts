import { FastifyRequest as Request } from "fastify";
// import { UserRowDto } from "./users/dtos";
import { User } from "./entities";

declare module "fastify" {
  interface FastifyRequest extends Request {
    user: User;
    xbox_user: {
      user_hash: string;
      xsts_token: string;
    };
  }
}
