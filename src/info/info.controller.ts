import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Patch,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { createReadStream, readFileSync } from "fs";
import { join } from "path";
import { FastifyReply } from "fastify";
import { ZodSerializerDto } from "nestjs-zod";

import { InfoService } from "./info.service";
import { InfoDto } from "./dtos/info.dto";
import { AdminGuard } from "src/guards/admin.guard";
import { GetUserByHwidsDto } from "../dtos/get-user-by-hwids.dto";
import { UsersService } from "src/users/users.service";
import { checkActiveSubscription } from "src/utils";

@Controller("info")
export class InfoController {
  constructor(
    private infoService: InfoService,
    private usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get("")
  @ZodSerializerDto(InfoDto)
  async getInfo() {
    return await this.infoService.get();
  }

  @UseGuards(AdminGuard)
  @ZodSerializerDto(InfoDto)
  @Patch("")
  async changeInfo(@Body() body: InfoDto) {
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
  async getOffsets(
    @Query() query: GetUserByHwidsDto,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    const { hwid1: hdd, hwid2: mac_address } = query;

    const user = await this.usersService.findOne({ hdd, mac_address });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.ban) {
      throw new UnauthorizedException("You have no access, please create ticket in discord");
    }

    checkActiveSubscription(user.expire_date);

    res.headers({ "Content-Type": "application/json" });

    const year = new Date().getUTCFullYear();
    const months = new Date().getUTCMonth();
    const day = new Date().getUTCDate();
    const hour = new Date().getUTCHours();
    let minute = Math.floor(new Date().getUTCMinutes() / 5) * 5;

    if (minute === 0) minute = 1;

    function encrypt(value: number) {
      return year * months * day * hour * minute * value;
    }

    // function decrypt(value: number) {
    //   return value / (year * months * day * hour * minute * 555);
    // }

    function transformOffsets(json: any, func: (value: number) => number) {
      const newOffsets = {};
      Object.keys(json).map((struct) => {
        newOffsets[struct] = {};
        Object.keys(json[struct]).map((offset) => {
          newOffsets[struct][offset] = func(json[struct][offset]);
        });
      });

      return newOffsets;
    }

    // const encryptedOffsets = await this.cacheManager.get("offsets");
    // const cachedMinute = await this.cacheManager.get("minute");

    const offsets = JSON.parse(
      readFileSync(join(process.cwd(), "resources/offsets.json")).toString()
    );

    const encryptedOffsets = transformOffsets(offsets, encrypt);

    // if (!encryptedOffsets || cachedMinute !== minute) {
    //   const encryptedOffsets = transformOffsets(this.offsets, encrypt);

    //   await this.cacheManager.set("offsets", encryptedOffsets, 0);
    //   await this.cacheManager.set("minute", minute, 0);

    //   return encryptedOffsets;
    // }

    return encryptedOffsets;
  }
}
