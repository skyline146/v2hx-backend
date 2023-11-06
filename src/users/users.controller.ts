import {
  Body,
  Controller,
  Get,
  Post,
  NotFoundException,
  UseGuards,
  Delete,
  BadRequestException,
  Request,
  Param,
  Patch,
  Res,
  Query,
} from "@nestjs/common";
import type { Response } from "express";
import { randomBytes } from "crypto";

import { UsersService } from "./users.service";
import { UserDto } from "./dtos/user.dto";
import { AuthService } from "../auth/auth.service";
import { AdminGuard } from "src/guards/admin.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ChangeUserDto } from "./dtos/change-user.dto";
import { GetUsersDto } from "./dtos/get-users.dto";
import { Serialize } from "src/interceptors/serialize.interceptor";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService, private authService: AuthService) {}

  @UseGuards(AdminGuard)
  @Post("")
  async createUser() {
    return this.authService.signUp();
  }

  @UseGuards(AdminGuard)
  // @Serialize(GetUsersDto)
  @Get("")
  async getUsers(@Query() query: Partial<{ page: string; username: string }>) {
    const { page, username } = query;
    const pageN: number = page ? +page : 1;

    const [users, total] = await this.usersService.findAll(pageN, username);

    return { users, total };
  }

  @UseGuards(AdminGuard)
  @Patch("/:username")
  async updateUser(@Param("username") username: string, @Body() body: Partial<UserDto>) {
    return this.usersService.update(username, body);
  }

  @UseGuards(AdminGuard)
  @Get("/:username")
  async getUser(@Param("username") username: string) {
    return this.usersService.findOne(username);
  }

  @UseGuards(AdminGuard)
  @Get("/:username/reset-password")
  async resetPassword(@Param("username") username: string) {
    const password = randomBytes(6).toString("hex");

    this.usersService.updatePassword(username, password);

    return { password };
  }

  @UseGuards(AdminGuard)
  @Delete("/:username")
  async deleteUser(@Param("username") username: string) {
    this.usersService.remove(username);
  }

  @Post("/change-username")
  async changeUsername(
    @Request() req,
    @Body() body: ChangeUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.usersService.findOne(body.newUsername);

    if (user) {
      throw new BadRequestException("Username in use");
    }

    const newUser = await this.usersService.update(req.user.username, {
      username: body.newUsername,
    });

    const { accessToken } = await this.authService.refreshToken(newUser);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(Date.now() + 60 * 60 * 1000),
    });

    return "Username changed!";
  }

  @Post("/change-password")
  async changePassword(@Request() req, @Body() body: ChangeUserDto) {
    await this.authService.validateUser(req.user.username, body.password);

    this.usersService.updatePassword(req.user.username, body.newPassword);

    return "Password changed!";
  }

  @Get("/test")
  time() {
    return new Date();
  }

  @Get("/date")
  async getDate(@Body() body: Partial<UserDto>) {
    const user = await this.usersService.findOne(body.username);

    return user;

    if (!user.expire_date) {
      throw new NotFoundException("user does not have subscription");
    }

    return user.expire_date < new Date() ? "expired" : "not expired";
  }
}
