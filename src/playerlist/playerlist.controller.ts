import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { ZodGuard, ZodSerializerDto } from "nestjs-zod";
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { ILike, Like } from "typeorm";

import { PlayerlistService } from "./playerlist.service";
import { XboxApiGuard } from "./guards/xbox-api.guard";
import { ActiveUserGuard, AdminGuard } from "src/guards";
import { JwtAuthGuard } from "src/auth/guards";

import {
  GetPlayersByXUIDsDto,
  AddPlayerDto,
  PlayerDto,
  GetPlayerByGamertagDto,
  PlayerRowDto,
} from "./dtos";

@Controller("playerlist")
export class PlayerlistController {
  constructor(
    private playerlistService: PlayerlistService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @UseGuards(AdminGuard)
  @Get("")
  async getPlayerlist(@Query() query: { search_value: string }) {
    const { search_value } = query;

    const searchQuery = search_value
      ? [{ gamertag: ILike(`%${search_value}%`) }, { xuid: Like(`%${search_value}%`) }]
      : undefined;

    const [players, total] = await this.playerlistService.findAll(searchQuery);

    return { players, total };
  }

  @UseGuards(ActiveUserGuard, new ZodGuard("body", GetPlayersByXUIDsDto))
  @Post("")
  async getPlayersWithTags(@Body() body: GetPlayersByXUIDsDto) {
    const xuidsWithTags = await this.playerlistService.getMatchedPlayers(
      body.xuids.map((xuid) => ({ xuid }))
    );

    const matched_xuids = xuidsWithTags.map((player) => ({ xuid: player.xuid, type: player.type }));

    return { matched_xuids };
  }

  @UseGuards(ActiveUserGuard, XboxApiGuard)
  @Get("/token")
  async getToken(@Request() req: FastifyRequest) {
    return req.xbox_user;
  }

  @UseGuards(JwtAuthGuard, ActiveUserGuard, new ZodGuard("params", GetPlayerByGamertagDto))
  @ZodSerializerDto(PlayerDto)
  @Get("/:gamertag")
  async getUser(@Param("gamertag") gamertag: string) {
    const player = await this.playerlistService.findOne({ gamertag: ILike(gamertag) });

    if (!player) {
      throw new NotFoundException("Player not found.");
    }

    return player;
  }

  @UseGuards(AdminGuard)
  @Patch("/:id")
  async updateUser(@Param("id") id: string, @Body() body: PlayerRowDto) {
    await this.playerlistService.update(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete("/:id")
  async deleteUser(@Param("id") id: string) {
    return await this.playerlistService.remove(id);
  }

  @UseGuards(JwtAuthGuard, ActiveUserGuard, new ZodGuard("body", AddPlayerDto), XboxApiGuard)
  @Post("/add")
  async addUser(@Request() req: FastifyRequest, @Body() body: AddPlayerDto) {
    const user = await this.playerlistService.checkPlayer(body.gamertag, req.xbox_user);

    try {
      await this.playerlistService.create(
        {
          ...user,
          type: body.type,
          reason: body.reason,
        },
        req.user.username
      );
    } catch (err) {
      throw new BadRequestException("Player has been added already");
    }

    this.logger.info(
      `User ${req.user.username} added ${user.gamertag}:${user.xuid} to playerlist. Reason: ${body.reason}`
    );

    return "Player added!";
  }

  @UseGuards(XboxApiGuard)
  @Get("/check/:xuidOrGamertag")
  async checkPlayer(
    @Request() req: FastifyRequest,
    @Param("xuidOrGamertag") xuidOrGamertag: string
  ) {
    return await this.playerlistService.checkPlayer(xuidOrGamertag, req.xbox_user);
  }
}
