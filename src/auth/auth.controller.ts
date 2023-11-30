import {
  Body,
  Controller,
  UnauthorizedException,
  Get,
  Post,
  Res,
  StreamableFile,
  Request,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import type { Response } from "express";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { AuthService } from "./auth.service";
import { UsersService } from "src/users/users.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { LoginUserDto } from "./dtos/login-user.dto";
import { UserDto } from "src/users/dtos/user.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshJwtGuard } from "./guards/refresh-jwt-auth.guard";
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
  async login(@Body() body: LoginUserDto, @Res({ passthrough: true }) res: Response) {
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
    res.set({ "Content-Disposition": 'attachment; filename="SoT-DLC-v3.dll"' });

    return new StreamableFile(file);
  }

  @UseGuards(LocalAuthGuard)
  @Post("/login-web")
  async signIn(@Request() req, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.signIn(req.user);

    res.cookie("accessToken", user.accessToken, getCookieOptions("accessToken"));
    res.cookie("refreshToken", user.refreshToken, getCookieOptions("refreshToken", "/api/auth"));

    return new UserDto(user);
  }

  @UseGuards(RefreshJwtGuard)
  @Get("/refresh")
  async refreshToken(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.refreshToken(req.user);

    res.cookie("accessToken", accessToken, getCookieOptions("accessToken"));

    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Get("/logout-web")
  logOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth" });

    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Get("/is-logged")
  async isLogged(@Request() req) {
    return new UserDto(await this.usersService.findOne({ username: req.user.username }));
  }
}
