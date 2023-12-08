import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { TokenService } from "src/token/token.service";

@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const refreshToken: string = request.cookies["refreshToken"];

    if (!refreshToken) {
      throw new UnauthorizedException("Provide token");
    }

    const user = this.tokenService.validate(refreshToken);

    if (!user) {
      throw new UnauthorizedException("Invalid token");
    }

    request.user = { admin: user.admin, username: user.username };

    return true;
  }
}
