import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";

import { TokenService } from "src/token/token.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const access_token: string = request.cookies["access_token"];

    if (!access_token) {
      throw new UnauthorizedException("Provide token");
    }

    const user = this.tokenService.validate(access_token);

    if (!user) {
      throw new UnauthorizedException("Invalid token");
    }

    return user.admin;
  }
}
