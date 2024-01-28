import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";

import { UsersService } from "src/users/users.service";
import { checkSubscription, decryptMagicValue, parseHwid } from "src/lib";
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

    if (request.body?.username && request.body?.password) {
      //if username and password are presented in request, validate by username and password
      const { username, password } = request.body;

      user = await this.authService.validateUser(username, password);
    } else if (request.headers["a"]) {
      //if headers with hwids presented in request, validate by decipher function
      // a - hdd, b - for another hwid (change mac_address)
      const { a, c } = request.headers;

      let hdd: string;

      try {
        const magicValue = decryptMagicValue(c);
        hdd = parseHwid(JSON.parse(a), magicValue);
        // mac_address = parseHwid(JSON.parse(b));

        user = await this.usersService.findOne({ hdd });
      } catch (err) {
        //throw error on invalid parsing
        throw new BadRequestException();
      }
    } else if (request.user) {
      //if user presented in request, after JwtAuthGuard
      user = await this.usersService.findOne({ username: request.user.username });
    }

    if (user === undefined) {
      throw new UnauthorizedException("This endpoint requires authorization.");
    }

    //check if user exists
    if (!user) {
      throw new NotFoundException("User not found.");
    }

    request.user = user;

    //if user is admin - allow without checking on ban and active subscription
    if (user.admin) return true;

    //check if account is banned
    if (user.ban) {
      this.usersService.update(user.username, {
        last_entry_date: new Date().toISOString(),
      });

      throw new ForbiddenException("You have no access, please create ticket in discord.");
    }

    //check on active subscription
    if (!checkSubscription(user.expire_date)) {
      throw new ForbiddenException("You don`t have active subscription.");
    }

    return true;
  }
}
