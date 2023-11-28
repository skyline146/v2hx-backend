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
} from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import type { Response } from "express";

import { AuthService } from "./auth.service";
// import { UsersService } from "../users/users.service";
import { UsersService } from "src/users/users.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { LoginUserDto } from "./dtos/login-user.dto";
// import { UserDto } from "../users/dtos/user.dto";
import { UserDto } from "src/users/dtos/user.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshJwtGuard } from "./guards/refresh-jwt-auth.guard";
import { checkActiveSubscription } from "src/utils";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
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

        throw new UnauthorizedException("Hwid does not match");
      }
    }

    //validation passed, return dll
    this.usersService.update(user.username, {
      last_hdd: hdd,
      last_mac_address: mac_address,
      last_entry_date: new Date().toISOString(),
    });

    const file = createReadStream(join(process.cwd(), "SoT-DLC-v3.dll"));
    res.set({ "Content-Disposition": 'attachment; filename="SoT-DLC-v3.dll"' });

    return new StreamableFile(file);
  }

  @UseGuards(LocalAuthGuard)
  @Post("/login-web")
  async signIn(@Request() req, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.signIn(req.user);

    res.cookie("accessToken", user.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });
    res.cookie("refreshToken", user.refreshToken, {
      httpOnly: true,
      secure: true,
      path: "/api/auth",
      sameSite: "strict",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return new UserDto(user);
  }

  @UseGuards(RefreshJwtGuard)
  @Get("/refresh")
  async refreshToken(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.refreshToken(req.user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });

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
