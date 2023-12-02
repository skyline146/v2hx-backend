import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const { username, password } = request.body as { username: string; password: string };

    const user = await this.authService.validateUser(username, password);

    request.user = user;

    return true;
  }
}
