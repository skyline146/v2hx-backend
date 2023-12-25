import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";

import { UsersService } from "src/users/users.service";
import { checkSubscription, parseHwid } from "src/lib";
import { GetUserByHwidsDto, UserRowDto } from "src/users/dtos";
import { AuthService } from "src/auth/auth.service";
import { LoginUserDto } from "src/auth/dtos/login-user.dto";

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private usersService: UsersService, private authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: FastifyRequest<{ Body: LoginUserDto; Headers: GetUserByHwidsDto }> = context
      .switchToHttp()
      .getRequest();

    let user: UserRowDto;

    if (request.body) {
      const { username, password } = request.body;

      user = await this.authService.validateUser(username, password);
    } else if (request.user) {
      user = await this.usersService.findOne({ username: request.user.username });
    } else {
      const { a, b } = request.headers;

      let hdd: string, mac_address: string;

      try {
        hdd = parseHwid(JSON.parse(a));
        mac_address = parseHwid(JSON.parse(b));

        user = await this.usersService.findOne({ hdd, mac_address });
      } catch (err) {
        throw new BadRequestException();
      }
    }

    //check if user exists
    if (!user) {
      throw new NotFoundException("User not found");
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
      throw new UnauthorizedException("You don`t have active subscription");
    }

    request.user = user;

    return true;
  }
}
