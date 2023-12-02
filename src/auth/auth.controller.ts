import {
  Body,
  Controller,
  UnauthorizedException,
  Get,
  Post,
  Res,
  Request,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import { FastifyReply, FastifyRequest } from "fastify";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { AuthService } from "./auth.service";
import { UsersService } from "src/users/users.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { LoginUserDto } from "./dtos/login-user.dto";
import { UserDto } from "src/users/dtos/user.dto";
// import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshJwtGuard } from "./guards/refresh-jwt.guard";
import { checkActiveSubscription, getCookieOptions } from "src/utils";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  //login in loader
  @Post("/login")
  async login(@Body() body: LoginUserDto, @Res() res: FastifyReply) {
    const { hwid1: hdd, hwid2: mac_address, username, password } = body;

    const user = await this.authService.validateUser(username, password);

    //check if account is banned
    if (user.ban) {
      this.usersService.update(user.username, {
        last_entry_date: new Date().toISOString(),
      });

      throw new UnauthorizedException("You have no access, please create ticket in discord");
    }

    //check on active subscription
    checkActiveSubscription(user.expire_date);

    //first login
    if (!user.hdd) {
      await this.usersService.update(user.username, {
        hdd,
        mac_address,
        last_hdd: hdd,
        last_mac_address: mac_address,
      });
    } //next logins
    else {
      //check hwids validity
      if (hdd !== user.hdd || mac_address !== user.mac_address) {
        this.usersService.update(user.username, {
          last_hdd: hdd,
          last_mac_address: mac_address,
          last_entry_date: new Date().toISOString(),
          ban: true,
          warn: user.warn + 1,
        });

        this.logger.warn(
          `User ${user.username} failed to log in with invalid hwids. Warns: ${user.warn + 1}`
        );

        throw new UnauthorizedException("Hwid does not match");
      }
    }

    //validation passed, return dll
    this.usersService.update(user.username, {
      last_hdd: hdd,
      last_mac_address: mac_address,
      last_entry_date: new Date().toISOString(),
    });

    // this.logger.info(`User ${user.username} successfully logged in loader.`);

    const file = createReadStream(join(process.cwd(), "SoT-DLC-v3.dll"));

    res.headers({
      "Content-Type": "application/x-msdownload",
      "Content-Disposition": 'attachment; filename="SoT-DLC-v3.dll"',
    });

    res.send(file);
  }

  @UseGuards(LocalAuthGuard)
  @Post("/login-web")
  async signIn(@Request() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const user = await this.authService.signIn(req.user);

    res.setCookie("accessToken", user.accessToken, getCookieOptions("accessToken", "/api"));
    res.setCookie("refreshToken", user.refreshToken, getCookieOptions("refreshToken", "/api/auth"));

    return new UserDto(user);
  }

  @UseGuards(RefreshJwtGuard)
  @Get("/refresh")
  async refreshToken(
    @Request() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const { accessToken } = await this.authService.refreshToken(req.user);

    res.setCookie("accessToken", accessToken, getCookieOptions("accessToken", "/api"));

    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Get("/logout-web")
  logOut(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie("accessToken", { path: "/api" });
    res.clearCookie("refreshToken", { path: "/api/auth" });

    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Get("/is-logged")
  async isLogged(@Request() req: FastifyRequest) {
    return new UserDto(await this.usersService.findOne({ username: req.user.username }));
  }
}
