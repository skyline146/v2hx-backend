import {
  Body,
  Controller,
  Get,
  Post,
  NotFoundException,
  UseGuards,
  Delete,
  Query,
  BadRequestException,
  Request,
  Param,
  Patch,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { UserDto } from "./dtos/user.dto";
import { AuthService } from "../auth/auth.service";
import { AdminGuard } from "src/guards/admin.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ChangeUserDto } from "./dtos/change-user.dto";

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
  @Delete("/:username")
  async deleteUser(@Param("username") username: string) {
    this.usersService.remove(username);
  }

  @Patch("/change-username")
  async changeUsername(@Request() req, @Body() body: ChangeUserDto) {
    const user = await this.usersService.findOne(body.newUsername);

    if (user) {
      throw new BadRequestException("Username in use");
    }

    const newUser = await this.usersService.update(req.user.username, {
      username: body.newUsername,
    });

    return this.authService.refreshToken(newUser);
  }

  @Patch("/change-password")
  async changePassword(@Request() req, @Body() body: ChangeUserDto) {
    await this.authService.validateUser(req.user.username, body.password);

    this.usersService.updatePassword(req.user.username, body.newPassword);
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
