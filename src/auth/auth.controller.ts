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
import { UsersService } from "src/users/users.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { LoginUserDto } from "./dtos/login-user.dto";
import { UserDto } from "src/users/dtos/user.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshJwtGuard } from "./guards/refresh-jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  //login in loader
  @Post("/login")
  async login(@Body() body: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const { hdd, mac_address, username, password } = body;

    const user = await this.authService.validateUser(username, password);

    //check on subscription
    const expire_date = new Date(user.expire_date);
    if (
      user.expire_date !== "Lifetime" &&
      (expire_date.toString() === "Invalid Date" || expire_date.getTime() < Date.now())
    ) {
      throw new UnauthorizedException("You dont have active subscription");
    }

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
      //check if ban
      if (user.ban) {
        this.usersService.update(user.username, {
          last_entry_date: new Date(),
        });

        throw new UnauthorizedException("You have no access, please create ticket in discord");
      }
      //check hwids validity
      if (hdd !== user.hdd || mac_address !== user.mac_address) {
        this.usersService.update(user.username, {
          last_hdd: hdd,
          last_mac_address: mac_address,
          last_entry_date: new Date(),
          ban: true,
          warn: user.warn + 1,
        });

        throw new UnauthorizedException("Hwid does not match");
      }
    }

    //validation passed, return dll
    this.usersService.update(user.username, {
      last_entry_date: new Date(),
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
      sameSite: "none",
      expires: new Date(Date.now() + 60 * 60 * 1000),
    });
    res.cookie("refreshToken", user.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return new UserDto(user);
  }

  @UseGuards(RefreshJwtGuard)
  @Get("/refresh")
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @Get("/logout-web")
  logOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Get("/is-logged")
  async isLogged(@Request() req) {
    return new UserDto(await this.usersService.findOne(req.user.username));
  }
}
