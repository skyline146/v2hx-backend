import { FastifyRequest as Request } from "fastify";
import { UserRowDto } from "./users/dtos";

declare module "fastify" {
  interface FastifyRequest extends Request {
    user: UserRowDto;
  }
}
