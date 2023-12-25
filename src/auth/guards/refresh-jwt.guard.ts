import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { TokenService } from "src/token/token.service";
import { UsersService } from "src/users/users.service";

@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(private tokenService: TokenService, private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const refresh_token: string = request.cookies["refresh_token"];

    if (!refresh_token) {
      throw new UnauthorizedException("Provide token");
    }

    const user = this.tokenService.validate(refresh_token);

    if (!user) {
      throw new UnauthorizedException("Invalid token");
    }

    request.user = user;

    return true;
  }
}
