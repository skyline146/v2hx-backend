import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";

import { TokenService } from "src/token/token.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const accessToken: string = request.cookies["accessToken"];

    if (!accessToken) {
      throw new UnauthorizedException("Provide token");
    }

    const user = this.tokenService.validate(accessToken);

    if (!user) {
      throw new UnauthorizedException("Invalid token");
    }

    return user.admin;
  }
}
