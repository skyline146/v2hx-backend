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
import { Not, And } from "typeorm";

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

    const [users, total] = await this.usersService.findLikePagination(pageN, username);

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

  @UseGuards(AdminGuard)
  @Patch("/:username")
  async updateUser(@Param("username") username: string, @Body() body: Partial<UserDto>) {
    return this.usersService.update(username, body);
  }

  @UseGuards(AdminGuard)
  @Get("/:username")
  async getUser(@Param("username") username: string) {
    return this.usersService.findOne({ username });
  }

  @UseGuards(AdminGuard)
  @Post("/:username/reset-password")
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

  @Patch("/change-username")
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

    const { accessToken } = await this.authService.refreshToken(newUser);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(Date.now() + 60 * 60 * 1000),
    });

    return "Username changed!";
  }

  @Patch("/change-password")
  async changePassword(@Request() req, @Body() body: ChangeUserDto) {
    await this.authService.validateUser(req.user.username, body.password);

    this.usersService.updatePassword(req.user.username, body.newPassword);

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
