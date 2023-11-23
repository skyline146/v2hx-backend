import { Body, Controller, Get, NotFoundException, Patch, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { createReadStream } from "fs";
import { join } from "path";

import { InfoService } from "./info.service";
import { InfoDto } from "./dtos/info.dto";
import { AdminGuard } from "src/guards/admin.guard";
import { GetOffsetsDto } from "./dtos/getOffsets.dto";
import { UsersService } from "src/users/users.service";
import { checkActiveSubscription } from "src/utils";

@Controller("info")
export class InfoController {
  constructor(private infoService: InfoService, private usersService: UsersService) {}

  @Get("")
  async getInfo() {
    const { cheat_version, loader_version, status } = await this.infoService.get();

    return { cheat_version, loader_version, status };
  }

  @UseGuards(AdminGuard)
  @Patch("")
  changeInfo(@Body() body: Partial<InfoDto>) {
    return this.infoService.update(body);
  }

  @Get("/offsets")
  async getOffsets(@Body() body: GetOffsetsDto, @Res() res: Response) {
    const { hwid1: hdd, hwid2: mac_address } = body;

    const user = await this.usersService.findOne({ hdd, mac_address });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    checkActiveSubscription(user.expire_date);

    const file = createReadStream(join(process.cwd(), "offsets.json"));
    res.set({ "Content-Type": "application/json" });

    file.pipe(res);
  }
}
