import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";

import { UsersService } from "src/users/users.service";
import { checkSubscription } from "src/utils";
import { GetUserDto, UserRowDto } from "src/users/dtos";
import { AuthService } from "src/auth/auth.service";
import { LoginUserDto } from "src/auth/dtos/login-user.dto";

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private usersService: UsersService, private authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest<{ Body: LoginUserDto; Querystring: GetUserDto }> = context
      .switchToHttp()
      .getRequest();

    let user = {} as UserRowDto;

    if (request.body) {
      const { username, password } = request.body;

      user = await this.authService.validateUser(username, password);
    } else if (request.query) {
      const { hwid1: hdd, hwid2: mac_address } = request.query;

      user = await this.usersService.findOne({ hdd, mac_address });

      //check if user exists
      if (!user) {
        throw new NotFoundException("User not found");
      }
    }

    //check if account is banned
    if (user.ban) {
      this.usersService.update(user.username, {
        last_entry_date: new Date().toISOString(),
      });

      throw new UnauthorizedException("You have no access, please create ticket in discord");
    }

    //check on active subscription
    if (!checkSubscription(user.expire_date)) {
      throw new UnauthorizedException("You dont have active subscription");
    }

    request.user = user;

    return true;
  }
}
