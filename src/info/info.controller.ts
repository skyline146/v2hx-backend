import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { createReadStream } from "fs";
import { join } from "path";

import { InfoService } from "./info.service";
import { InfoDto } from "./dtos/info.dto";
import { AdminGuard } from "src/guards/admin.guard";
import { GetOffsetsDto } from "./dtos/getOffsets.dto";
import { UsersService } from "src/users/users.service";

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
    const { hwid1, hwid2 } = body;

    const user = await this.usersService.findOne({ hdd: hwid1, mac_address: hwid2 });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const expire_date = new Date(user.expire_date);
    if (
      user.expire_date !== "Lifetime" &&
      (!user.expire_date || expire_date.getTime() < Date.now())
    ) {
      throw new UnauthorizedException("You dont have active subscription");
    }

    const file = createReadStream(join(process.cwd(), "offsets.json"));
    res.set({ "Content-Type": "application/json" });

    file.pipe(res);
  }

  @UseGuards(AdminGuard)
  @Patch("/offsets")
  changeOffsets(@Body() body: Partial<InfoDto>) {
    return this.infoService.update(body);
  }
}
