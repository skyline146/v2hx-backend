import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AuthService } from "../auth.service";

@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const refreshToken: string = request.cookies["refreshToken"];

    const user = this.authService.validateToken(refreshToken);

    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }

    request.user = { admin: user.admin, username: user.username };

    return true;
  }
}
