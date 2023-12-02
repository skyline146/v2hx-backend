import { FastifyRequest as Request } from "fastify";

declare module "fastify" {
  interface FastifyRequest extends Request {
    user: { admin: boolean; username: string };
  }
}
