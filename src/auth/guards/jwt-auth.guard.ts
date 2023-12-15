import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";
import { TokenService } from "src/token/token.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private tokenService: TokenService) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const access_token: string = request.cookies["access_token"];

    if (!access_token) {
      throw new UnauthorizedException("Provide token");
    }

    const user = this.tokenService.validate(access_token);

    if (!user) {
      throw new UnauthorizedException("Invalid token");
    }

    request.user = { admin: user.admin, username: user.username };

    return true;
  }
}
