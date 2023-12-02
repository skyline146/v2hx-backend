import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "../auth.service";
import { FastifyRequest } from "fastify";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const accessToken = request.cookies["accessToken"];

    const user = this.authService.validateToken(accessToken);

    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = { admin: user.admin, username: user.username };

    return true;
  }
}
