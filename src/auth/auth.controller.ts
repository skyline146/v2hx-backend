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
  BadRequestException,
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
import { getCookieOptions, parseHwid, logToDiscord, invalidHwidsLog } from "src/lib";

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
    const { a, b } = body;

    const loginHdd = parseHwid(a);
    const loginMacAddress = parseHwid(b);

    try {
      await this.usersService.findOne({ hdd: loginHdd, mac_address: loginMacAddress });
    } catch (err) {
      throw new BadRequestException();
    }

    const user = req.user;

    //first login
    if (!user.hdd) {
      await this.usersService.update(user.username, {
        hdd: loginHdd,
        mac_address: loginMacAddress,
        ip: req.ip,
      });
    } //check hwids validity on next logins
    else {
      try {
        //check hdd validity
        if (loginHdd !== user.hdd) {
          throw new Error("Invalid HDD");
        }
        //if user dont have mac_address on next logins, pass if hdd valid
        if (loginMacAddress) {
          //if user doen't have static mac_address in database, store it and pass
          if (!user.mac_address) {
            //update user static mac_address
            this.usersService.update(user.username, {
              mac_address: loginMacAddress,
            });
          } else {
            //check mac_address validity
            if (loginMacAddress !== user.mac_address) {
              throw new Error("Invalid MAC Address");
            }
          }
        }
      } catch (err) {
        //adding ban
        this.usersService.update(user.username, {
          last_hdd: loginHdd,
          last_mac_address: loginMacAddress,
          last_entry_date: new Date().toISOString(),
          last_ip: req.ip,
          warn: user.warn + 1,
          ban: true,
        });

        this.logger.warn(invalidHwidsLog(user, loginHdd, loginMacAddress, req.ip));
        //log to discord with red level
        logToDiscord(invalidHwidsLog(user, loginHdd, loginMacAddress, req.ip), 15548997);

        // "Computer does not match with initial account"
        throw new UnauthorizedException("Computer does not match with initial account");
      }
    }

    //validation passed, return dll
    this.usersService.update(user.username, {
      last_hdd: loginHdd,
      last_mac_address: loginMacAddress,
      last_entry_date: new Date().toISOString(),
      last_ip: req.ip,
    });

    this.logger.info(`User ${user.username} logged in loader. IP: ${req.ip}`);

    const file = createReadStream(join(process.cwd(), "resources/SoT-DLC-v3.dll"));

    res
      .headers({
        "Content-Disposition": 'attachment; filename="response"',
      })
      .send(file);
  }

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
  @Post("/refresh")
  refreshToken(@Request() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { access_token, refresh_token } = this.tokenService.refresh(req.user);

    res.setCookie("access_token", access_token, getCookieOptions("access_token"));
    res.setCookie("refresh_token", refresh_token, getCookieOptions("refresh_token"));

    return { access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Post("/logout-web")
  logOut(@Res() res: FastifyReply) {
    res.clearCookie("access_token", getCookieOptions("access_token"));
    res.clearCookie("refresh_token", getCookieOptions("refresh_token"));

    res.code(204).send();
  }
}
