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
  Inject,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "crypto";
import { Not, And, Like, ILike } from "typeorm";
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { UseZodGuard, ZodSerializerDto } from "nestjs-zod";

import { UsersService } from "./users.service";
import { AuthService } from "../auth/auth.service";
import { User } from "src/entities";
import { AdminGuard } from "src/guards/admin.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Public } from "src/decorators/public.decorator";
import { TokenService } from "src/token/token.service";
import {
  checkSubscription,
  decryptMagicValue,
  getCookieOptions,
  getHashedPassword,
  parseHwid,
} from "src/lib";

import {
  ChangePasswordDto,
  ChangeUsernameDto,
  UsersTableDto,
  UserRowDto,
  GetUsersQueryDto,
  GetUserByHwidsDto,
  GetUserByHwidsResponseDto,
} from "./dtos";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private authService: AuthService,
    private tokenService: TokenService,
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
  @ZodSerializerDto(UsersTableDto)
  @Get("")
  async getUsers(@Query() query: GetUsersQueryDto) {
    const { page, search_value } = query;
    const pageN: number = page ? +page : 1;

    const searchQuery = search_value
      ? [{ username: ILike(`%${search_value}%`) }, { discord_id: Like(`%${search_value}%`) }]
      : undefined;

    const [users, total] = await this.usersService.findLikePagination(pageN, searchQuery);

    return { users, total };
  }

  @UseGuards(AdminGuard)
  @ZodSerializerDto(UsersTableDto)
  @Get("/online")
  async getOnlineUsers() {
    const [users, total] = await this.usersService.findAllCount({ online: true });

    return { users, total };
  }

  @UseGuards(AdminGuard)
  @Patch("/add-free-day")
  async addFreeDay() {
    const users: User[] = (
      await this.usersService.findAll({
        expire_date: And(Not(""), Not("Lifetime")),
      })
    )
      .filter((user) => checkSubscription(user.expire_date))
      .map((user) => ({
        ...user,
        expire_date: new Date(
          new Date(user.expire_date).getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
      }));

    await this.usersService.updateMany(users);

    this.logger.info("Added 1 free day to all active users.");

    return true;
  }

  @Public()
  @ZodSerializerDto(GetUserByHwidsResponseDto)
  @Get("/get-by-hwids")
  async getUserByHwids(@Request() req: FastifyRequest<{ Headers: GetUserByHwidsDto }>) {
    const { a, c } = req.headers;

    let hdd: string;

    let user: UserRowDto;

    try {
      const magicValue = decryptMagicValue(c);
      hdd = parseHwid(JSON.parse(a), magicValue);

      // mac_address = parseHwid(JSON.parse(b));

      user = await this.usersService.findOne({ hdd });
    } catch {
      throw new BadRequestException();
    }

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  @UseGuards(AdminGuard)
  @Patch("/:username")
  async updateUser(@Param("username") username: string, @Body() body: UserRowDto) {
    const oldUser = await this.usersService.findOne({ username });

    const changesObject = {};
    Object.keys(body).forEach((key) => {
      if (oldUser[key] !== body[key]) {
        changesObject[key] = `from: ${oldUser[key]} to: ${body[key]}`;
      }
    });

    this.logger.info(`Changed ${username}: ${JSON.stringify(changesObject, null, "\t")}`);

    await this.usersService.update(username, body);
  }

  @UseGuards(AdminGuard)
  @Get("/:username")
  async getUser(@Param("username") username: string) {
    return this.usersService.findOne({ username });
  }

  @UseGuards(AdminGuard)
  @Delete("/:username")
  async deleteUser(@Param("username") username: string) {
    this.logger.warn(`${username} was deleted.`);
    return await this.usersService.remove(username);
  }

  @UseGuards(AdminGuard)
  @Post("/:username/reset-password")
  async resetPassword(@Param("username") username: string) {
    const newPassword = randomBytes(6).toString("hex");

    const newHashedPassword = await getHashedPassword(newPassword);

    await this.usersService.update(username, { password: newHashedPassword });

    return { password: newPassword };
  }

  @UseZodGuard("body", ChangeUsernameDto)
  @Post("/change-username")
  async changeUsername(
    @Request() req: FastifyRequest,
    @Body() body: ChangeUsernameDto,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const user = await this.usersService.findOne({ username: body.newUsername });

    //if user exists throw an error
    if (user) {
      throw new BadRequestException("Username in use");
    }

    const updatedUser = await this.usersService.update(req.user.username, {
      username: body.newUsername,
    });

    const { access_token, refresh_token } = this.tokenService.refresh(updatedUser);

    res.setCookie("access_token", access_token, getCookieOptions("access_token"));
    res.setCookie("refresh_token", refresh_token, getCookieOptions("refresh_token"));

    this.logger.info(`${req.user.username} changed username to: ${updatedUser.username}.`);

    return "Username changed!";
  }

  @UseZodGuard("body", ChangePasswordDto)
  @Post("/change-password")
  async changePassword(@Request() req: FastifyRequest, @Body() body: ChangePasswordDto) {
    const user = await this.authService.validateUser(req.user.username, body.password);

    const newHashedPassword = await getHashedPassword(body.newPassword);

    await this.usersService.update(user.username, { password: newHashedPassword });

    return "Password changed!";
  }
}
