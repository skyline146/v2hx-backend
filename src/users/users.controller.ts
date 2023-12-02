import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Delete,
  BadRequestException,
  Request,
  Param,
  Patch,
  Res,
  Query,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "crypto";
import { Not, And, Like } from "typeorm";
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

import { UsersService } from "./users.service";
import { UserDto } from "./dtos/user.dto";
import { AuthService } from "../auth/auth.service";
import { AdminGuard } from "src/guards/admin.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ChangeUserDto } from "./dtos/change-user.dto";
import { Public } from "src/decorators/public.decorator";
import { GetUserByHwidsDto } from "src/info/dtos/get-user-by-hwids.dto";
import { InfoService } from "src/info/info.service";
import { getCookieOptions, getHashedPassword } from "src/utils";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private authService: AuthService,
    private infoService: InfoService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @UseGuards(AdminGuard)
  @Post("")
  async createUser() {
    const newUser = await this.authService.signUp();
    this.logger.info(`New account created: ${newUser.username}.`);
    return newUser;
  }

  @UseGuards(AdminGuard)
  @Get("")
  async getUsers(@Query() query: Partial<{ page: string; search_value: string | undefined }>) {
    const { page, search_value } = query;
    const pageN: number = page ? +page : 1;

    const searchQuery = search_value
      ? [{ username: Like(`%${search_value}%`) }, { discord_username: Like(`%${search_value}%`) }]
      : { username: undefined };

    const [users, total] = await this.usersService.findLikePagination(pageN, searchQuery);

    return { users, total };
  }

  @UseGuards(AdminGuard)
  @Patch("/add-free-day")
  async addFreeDay() {
    const users = (
      await this.usersService.findAll({ expire_date: And(Not(""), Not("Lifetime")) })
    ).filter((user) => new Date(user.expire_date).getTime() > Date.now());

    await this.usersService.updateMany(
      users.map((user) => ({
        ...user,
        expire_date: new Date(
          new Date(user.expire_date).getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
      }))
    );

    // this.logger.info("Added 1 free day.");

    return true;
  }

  @Public()
  @Get("/get-by-hwids")
  async getUserByHwids(@Query() query: GetUserByHwidsDto) {
    const { hwid1: hdd, hwid2: mac_address } = query;

    const user = await this.usersService.findOne({ hdd, mac_address });
    const { cheat_version } = await this.infoService.get();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.ban) {
      throw new UnauthorizedException("You have no access, please create ticket in discord");
    }

    const { expire_date, username } = user;

    return { expire_date, username, cheat_version };
  }

  @UseGuards(AdminGuard)
  @Patch("/:username")
  async updateUser(@Param("username") username: string, @Body() body: Partial<UserDto>) {
    const oldUser = await this.usersService.findOne({ username });

    const changesObject = {};
    Object.keys(body).forEach((key) => {
      if (oldUser[key] !== body[key]) {
        changesObject[key] = `from: ${oldUser[key]} to: ${body[key]}`;
      }
    });

    this.logger.info(`Admin changed ${username}: ${JSON.stringify(changesObject, null, "\t")}`);

    return await this.usersService.update(username, body);
  }

  @UseGuards(AdminGuard)
  @Get("/:username")
  async getUser(@Param("username") username: string) {
    return this.usersService.findOne({ username });
  }

  @UseGuards(AdminGuard)
  @Post("/:username/reset-password")
  async resetPassword(@Param("username") username: string) {
    const newPassword = randomBytes(6).toString("hex");

    const newHashedPassword = await getHashedPassword(newPassword);

    await this.usersService.update(username, { password: newHashedPassword });

    return { password: newPassword };
  }

  @UseGuards(AdminGuard)
  @Delete("/:username")
  async deleteUser(@Param("username") username: string) {
    this.logger.warn(`${username} was deleted.`);
    return await this.usersService.remove(username);
  }

  @Post("/change-username")
  async changeUsername(
    @Request() req: FastifyRequest,
    @Body() body: ChangeUserDto,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const user = await this.usersService.findOne({ username: body.newUsername });

    if (user) {
      throw new BadRequestException("Username in use");
    }

    const newUser = await this.usersService.update(req.user.username, {
      username: body.newUsername,
    });

    const { accessToken, refreshToken } = await this.authService.refreshToken(newUser);

    res.setCookie("accessToken", accessToken, getCookieOptions("accessToken", "/api"));
    res.setCookie("refreshToken", refreshToken, getCookieOptions("refreshToken", "/api/auth"));

    this.logger.info(`${req.user.username} changed username to: ${body.newUsername}.`);

    return "Username changed!";
  }

  @Post("/change-password")
  async changePassword(@Request() req: FastifyRequest, @Body() body: ChangeUserDto) {
    await this.authService.validateUser(req.user.username, body.password);

    const newHashedPassword = await getHashedPassword(body.newPassword);

    await this.usersService.update(req.user.username, { password: newHashedPassword });

    return "Password changed!";
  }
}
