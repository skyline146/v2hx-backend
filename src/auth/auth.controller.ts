import {
  Body,
  Controller,
  UnauthorizedException,
  Get,
  Post,
  Res,
  Session,
  StreamableFile,
  Request,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import { AuthService } from "./auth.service";
import { UsersService } from "src/users/users.service";
import type { Response } from "express";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { LoginUserDto } from "./dtos/login-user.dto";
import { Serialize } from "src/interceptors/serialize.interceptor";
import { UserDto } from "src/users/dtos/user.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshJwtGuard } from "./guards/refresh-jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post("/login")
  async login(@Body() body: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const { hdd, mac_adress, username, password } = body;

    const user = await this.authService.validateUser(username, password);

    //first login
    if (!user.hdd) {
      await this.usersService.update(user.username, {
        hdd,
        mac_adress,
        last_hdd: hdd,
        last_mac_adress: mac_adress,
        last_entry_date: new Date(),
      });
    } //next logins
    else {
      //check hwids validity
      if (hdd !== user.hdd || mac_adress !== user.mac_adress) {
        this.usersService.update(user.username, {
          last_hdd: hdd,
          last_mac_adress: mac_adress,
          last_entry_date: new Date(),
        });
        throw new UnauthorizedException("hwid does not match");
      }

      this.usersService.update(user.username, {
        last_entry_date: new Date(),
      });

      const file = createReadStream(join(process.cwd(), "SoT-DLC-v3.dll"));
      res.set({ "Content-Disposition": 'attachment; filename="SoT-DLC-v3.dll"' });

      return new StreamableFile(file);
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post("/login-web")
  async signIn(@Request() req) {
    // console.log(req.body);

    // const user = await this.authService.signIn(req.user);

    // res.cookie("accessToken", user.accessToken, { httpOnly: true });
    // res.cookie("refreshToken", user.refreshToken, { httpOnly: true });

    return new UserDto(await this.authService.signIn(req.user));
  }

  @UseGuards(RefreshJwtGuard)
  @Get("/refresh")
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/is-logged")
  async isLogged(@Request() req) {
    return new UserDto(await this.usersService.findOne(req.user.username));
  }
}
