import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import { FastifyReply } from "fastify";

import { InfoService } from "./info.service";
import { InfoDto } from "./dtos/info.dto";
import { AdminGuard } from "src/guards/admin.guard";
import { GetUserByHwidsDto } from "./dtos/get-user-by-hwids.dto";
import { UsersService } from "src/users/users.service";
import { checkActiveSubscription } from "src/utils";

@Controller("info")
export class InfoController {
  constructor(private infoService: InfoService, private usersService: UsersService) {}

  @Get("")
  async getInfo() {
    return await this.infoService.get();
  }

  @UseGuards(AdminGuard)
  @Patch("")
  async changeInfo(@Body() body: Partial<InfoDto>) {
    return this.infoService.update(body);
  }

  @UseGuards(AdminGuard)
  @Get("/logs")
  async getLogs(@Res() res: FastifyReply) {
    const file = createReadStream(join(process.cwd(), "src/logs.log"));

    res.headers({ "Content-Type": "text/plain" });

    res.send(file);
  }

  @Get("/offsets")
  async getOffsets(@Query() query: GetUserByHwidsDto, @Res() res: FastifyReply) {
    const { hwid1: hdd, hwid2: mac_address } = query;

    const user = await this.usersService.findOne({ hdd, mac_address });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.ban) {
      throw new UnauthorizedException("You have no access, please create ticket in discord");
    }

    checkActiveSubscription(user.expire_date);

    const file = createReadStream(join(process.cwd(), "offsets.json"));

    res.headers({ "Content-Type": "application/json" });

    res.send(file);
  }
}
