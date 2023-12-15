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
import { ZodGuard, ZodSerializerDto } from "nestjs-zod";

import { AuthService } from "./auth.service";
import { UsersService } from "src/users/users.service";
import { LocalAuthGuard, RefreshJwtGuard, JwtAuthGuard } from "./guards";
import { ActiveUserGuard } from "src/guards";
import { TokenService } from "src/token/token.service";

import { LoginUserDto } from "./dtos/login-user.dto";
import { UserDto } from "src/users/dtos/user.dto";
import { getCookieOptions } from "src/lib";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  //login in loader
  @UseGuards(new ZodGuard("body", LoginUserDto), ActiveUserGuard)
  @Post("/login")
  async login(
    @Body() body: LoginUserDto,
    @Request() req: FastifyRequest,
    @Res() res: FastifyReply
  ) {
    const { hwid1: hdd, hwid2: mac_address } = body;

    const user = req.user;

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
      last_entry_date: new Date().toISOString(),
    });

    // this.logger.info(`User ${user.username} successfully logged in loader.`);

    const file = createReadStream(join(process.cwd(), "resources/SoT-DLC-v3.dll"));

    res
      .headers({
        "Content-Type": "application/x-msdownload",
        "Content-Disposition": 'attachment; filename="SoT-DLC-v3.dll"',
      })
      .send(file);
  }

  // @Get("/dll")
  // getDll() {}

  @UseGuards(LocalAuthGuard)
  @ZodSerializerDto(UserDto)
  @Post("/login-web")
  signIn(@Request() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const user = this.authService.signIn(req.user);

    res.setCookie("access_token", user.access_token, getCookieOptions("access_token"));
    res.setCookie("refresh_token", user.refresh_token, getCookieOptions("refresh_token"));

    return user;
  }

  @UseGuards(JwtAuthGuard)
  @ZodSerializerDto(UserDto)
  @Get("/is-logged")
  async isLogged(@Request() req: FastifyRequest) {
    return await this.usersService.findOne({ username: req.user.username });
  }

  @UseGuards(RefreshJwtGuard)
  @Get("/refresh")
  refreshToken(@Request() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { access_token } = this.tokenService.refresh(req.user);

    res.setCookie("access_token", access_token, getCookieOptions("access_token"));

    return { refreshed: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("/logout-web")
  logOut(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie("access_token", getCookieOptions("access_token"));
    res.clearCookie("refresh_token", getCookieOptions("refresh_token"));

    return { logged_out: true };
  }
}
