import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";
import { AuthService } from "../auth/auth.service";
// import { AuthService } from "src/auth/auth.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { accessToken }: any = request.cookies;

    if (!accessToken) {
      throw new UnauthorizedException("Please provide token");
    }

    const data = await this.authService.validateToken(accessToken);

    return data.admin;
  }
}
