import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
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
    return await this.playerlistService.getPlayersByXUIDs(body.xuids, {
      userHash: req.xbox_api.userHash,
      XSTSToken: req.xbox_api.XSTSToken,
    });
  }
}
