import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { UseZodGuard } from "nestjs-zod";

import { PlayerlistService } from "./playerlist.service";
import { GetPlayersByXUIDsDto } from "./dtos";
import { XboxApiGuard } from "./guards/xbox-api.guard";

@UseGuards(XboxApiGuard)
@Controller("playerlist")
export class PlayerlistController {
  constructor(private playerlistService: PlayerlistService) {}

  @UseZodGuard("body", GetPlayersByXUIDsDto)
  @Post("")
  async getPlayers(@Request() req: FastifyRequest, @Body() body: GetPlayersByXUIDsDto) {
    const players = await this.playerlistService.getPlayersByXUIDs(body.xuids, {
      user_hash: req.xbox_user.user_hash,
      xsts_token: req.xbox_user.xsts_token,
    });

    return players;
  }

  @Get("/token")
  async getToken(@Request() req: FastifyRequest) {
    return req.xbox_user;
  }
}
