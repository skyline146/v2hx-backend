import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";
import { FastifyRequest } from "fastify";
import { AuthService } from "../auth/auth.service";
// import { AuthService } from "src/auth/auth.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest = context.switchToHttp().getRequest();

    const accessToken: string = request.cookies["accessToken"];

    if (!accessToken) {
      throw new UnauthorizedException("Please provide token");
    }

    const user = this.authService.validateToken(accessToken);

    return user.admin;
  }
}
