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
import { SkipThrottle } from "@nestjs/throttler";
import { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "crypto";
import { Like, ILike, MoreThanOrEqual } from "typeorm";
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
import { WebSocketsGateway } from "src/websockets/websockets.gateway";

import {
  decryptMagicValue,
  getCookieOptions,
  getHashedPassword,
  parseHwid,
  addDaysToSubscription,
} from "src/lib";

import {
  ChangePasswordDto,
  ChangeUsernameDto,
  UsersTableDto,
  UserRowDto,
  GetUsersQueryDto,
  GetUserByHwidsDto,
  GetUserByHwidsResponseDto,
  EmitClientEventDto,
} from "./dtos";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private authService: AuthService,
    private tokenService: TokenService,
    private webSocketsGateway: WebSocketsGateway,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @UseGuards(AdminGuard)
  @Post("")
  async createUser() {
    const newUser = await this.authService.signUp();
    this.logger.info(`New account created: ${newUser.username}.`);
    return newUser;
  }

  @SkipThrottle()
  @UseGuards(AdminGuard)
  @UseZodGuard("query", GetUsersQueryDto)
  @ZodSerializerDto(UsersTableDto)
  @Get("")
  async getUsers(@Query() query: GetUsersQueryDto) {
    const { page, search_value, filter } = query;

    const searchQuery = [];

    if (search_value) {
      searchQuery.push(
        { username: ILike(`%${search_value}%`) },
        { discord_id: Like(`%${search_value}%`) },
        { hdd: Like(`%${search_value}%`) }
      );
    }

    switch (filter) {
      case "online": {
        if (searchQuery.length === 0) {
          searchQuery.push({ online: true });
        } else {
          searchQuery.forEach((query) => {
            query.online = true;
          });
        }

        break;
      }
      case "active_subscription": {
        if (searchQuery.length === 0) {
          searchQuery.push({ expire_date: MoreThanOrEqual(new Date().toISOString()) });
        } else {
          searchQuery.forEach((query) => {
            // query.subscription_type = activeSubscriptionQuery[0].subscription_type;
            query.expire_date = MoreThanOrEqual(new Date().toISOString());
          });
        }

        break;
      }
    }

    const [users, total] = await this.usersService.findLikePagination(page, searchQuery);

    return { users, total };
  }

  @UseGuards(AdminGuard)
  @Patch("/add-free-day")
  async addFreeDay() {
    const users: User[] = (
      await this.usersService.findAll({
        expire_date: MoreThanOrEqual(new Date().toISOString()),
      })
    ).map((user) => ({
      ...user,
      expire_date: addDaysToSubscription(user, 1),
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
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  @UseGuards(AdminGuard)
  @Patch("/:username")
  async updateUser(@Param("username") username: string, @Body() newUserData: UserRowDto) {
    const oldUser = await this.usersService.findOne({ username });

    const changesObject = {};
    Object.keys(newUserData).forEach((key) => {
      if (oldUser[key] !== newUserData[key]) {
        changesObject[key] = `from: ${oldUser[key]} to: ${newUserData[key]}`;
      }
    });

    //emit client event if user online and assigned ban
    if (newUserData.ban && oldUser.online) {
      this.webSocketsGateway.emitClientEvent(username, "ban", {
        ban: true,
      });
    }

    this.logger.info(`Changed ${username}: ${JSON.stringify(changesObject, null, "\t")}`);

    await this.usersService.update(username, newUserData);
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
  @UseZodGuard("body", EmitClientEventDto)
  @Post("/:username/emit-event")
  async emitConnectedUserEvent(
    @Param("username") username: string,
    @Body() body: EmitClientEventDto
  ) {
    const user = await this.usersService.findOne({ username });

    console.log(body);

    if (!user.online) {
      throw new BadRequestException("User offline.");
    }

    this.webSocketsGateway.emitClientEvent(user.username, body.event, body.data);
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
      throw new BadRequestException("Username in use.");
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
