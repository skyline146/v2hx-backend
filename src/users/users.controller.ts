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
} from "@nestjs/common";
import type { Response } from "express";
import { randomBytes } from "crypto";
import { Not, And, Like } from "typeorm";

import { UsersService } from "./users.service";
import { UserDto } from "./dtos/user.dto";
import { AuthService } from "../auth/auth.service";
// import { AdminGuard } from "../guards/admin.guard";
import { AdminGuard } from "src/guards/admin.guard";
// import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ChangeUserDto } from "./dtos/change-user.dto";
// import { Public } from "../decorators/public.decorator";
import { Public } from "src/decorators/public.decorator";
import { GetOffsetsDto } from "src/info/dtos/getOffsets.dto";
import { InfoService } from "src/info/info.service";
import { getHashedPassword } from "src/utils";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private authService: AuthService,
    private infoService: InfoService
  ) {}

  @UseGuards(AdminGuard)
  @Post("")
  async createUser() {
    return await this.authService.signUp();
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

    return true;
  }

  @Public()
  @Get("/get-by-hwids")
  async getUserByHwids(@Body() body: GetOffsetsDto) {
    const { hwid1: hdd, hwid2: mac_address } = body;

    const user = await this.usersService.findOne({ hdd, mac_address });
    const { cheat_version } = await this.infoService.get();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const { expire_date, username } = user;

    return { expire_date, username, cheat_version };
  }

  @UseGuards(AdminGuard)
  @Patch("/:username")
  async updateUser(@Param("username") username: string, @Body() body: Partial<UserDto>) {
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
    return await this.usersService.remove(username);
  }

  @Post("/change-username")
  async changeUsername(
    @Request() req,
    @Body() body: ChangeUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.usersService.findOne({ username: body.newUsername });

    if (user) {
      throw new BadRequestException("Username in use");
    }

    const newUser = await this.usersService.update(req.user.username, {
      username: body.newUsername,
    });

    const { accessToken, refreshToken } = await this.authService.refreshToken(newUser);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      path: "/api/auth",
      sameSite: "strict",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return "Username changed!";
  }

  @Post("/change-password")
  async changePassword(@Request() req, @Body() body: ChangeUserDto) {
    await this.authService.validateUser(req.user.username, body.password);

    const newHashedPassword = await getHashedPassword(body.newPassword);

    await this.usersService.update(req.user.username, { password: newHashedPassword });

    return "Password changed!";
  }

  @Public()
  @Get("/:username/subscription")
  async getDate(@Param("username") username: string) {
    const user = await this.usersService.findOne({ username });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return { expire_date: user.expire_date };
  }
}
