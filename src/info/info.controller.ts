import { Body, Controller, Get, Inject, Patch, Res, UseGuards } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { FastifyReply } from "fastify";
import { ZodGuard, ZodSerializerDto } from "nestjs-zod";
import { createReadStream, readFileSync } from "fs";
import { join } from "path";

import { InfoService } from "./info.service";
import { AdminGuard, ActiveUserGuard } from "src/guards";

import { InfoDto } from "./dtos/info.dto";
import { Offsets } from "./types";
import { GetUserByHwidsDto } from "src/users/dtos";

@Controller("info")
export class InfoController {
  constructor(
    private infoService: InfoService,
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

  @UseGuards(new ZodGuard("query", GetUserByHwidsDto), ActiveUserGuard)
  @Get("/offsets")
  async getOffsets() {
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

    function transformOffsets(json: Offsets, method: (value: number) => number) {
      const newOffsets: Offsets = {};
      Object.keys(json).map((struct) => {
        newOffsets[struct] = {};
        Object.keys(json[struct]).map((offset) => {
          newOffsets[struct][offset] = method(json[struct][offset]);
        });
      });

      return newOffsets;
    }

    const cachedOffsets = await this.cacheManager.get<Offsets>("offsets");
    const cachedMinute = await this.cacheManager.get<number>("minute");

    if (!cachedOffsets || cachedMinute !== minute) {
      const offsets: Offsets = JSON.parse(
        readFileSync(join(process.cwd(), "resources/offsets.json")).toString()
      );

      const encryptedOffsets = transformOffsets(offsets, encrypt);

      await this.cacheManager.set("offsets", encryptedOffsets, 0);
      await this.cacheManager.set("minute", minute, 0);

      return encryptedOffsets;
    }

    return cachedOffsets;
  }
}
