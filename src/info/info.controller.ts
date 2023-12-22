import { Body, Controller, Get, Inject, Param, Patch, Res, UseGuards } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { FastifyReply } from "fastify";
import { ZodSerializerDto } from "nestjs-zod";
import { createReadStream, readFileSync } from "fs";
import { join } from "path";

import { InfoService } from "./info.service";
import { AdminGuard, ActiveUserGuard } from "src/guards";

import { InfoDto } from "./dtos/info.dto";
import { Offsets } from "./types";

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

  @Get("/file")
  get(@Res() res: FastifyReply) {
    const file = createReadStream(join(process.cwd(), `resources/data.json`));

    res.headers({
      "Content-Type": "application/json",
      // "Content-Disposition": 'attachment; filename="SoT-DLC-v3.dll"',
    });
    res.send(file);
  }

  @UseGuards(AdminGuard)
  @Get("/logs/:date")
  async getLogs(@Param("date") date: string, @Res() res: FastifyReply) {
    const file = createReadStream(join(process.cwd(), `logs/${date}.log`));

    file.on("error", () => {
      res.code(404).send(JSON.stringify({ message: "File not found" }));
    });

    res.headers({ "Content-Type": "text/plain" });
    res.send(file);
  }

  @UseGuards(ActiveUserGuard)
  @Get("/offsets")
  async getOffsets() {
    const currDate = new Date(),
      year = currDate.getUTCFullYear(),
      month = currDate.getUTCMonth(),
      day = currDate.getUTCDate(),
      hour = currDate.getUTCHours();

    function encrypt(value: number) {
      return year * month * day * hour * value;
    }

    // function decrypt(value: number) {
    //   return value / (year * months * day * hour * minute * 555);
    // }

    function transformOffsets(json: Offsets, method: typeof encrypt) {
      const newOffsets: Offsets = {};
      Object.keys(json).map((offset) => {
        newOffsets[offset] = method(json[offset]);
      });

      return newOffsets;
    }

    const cachedOffsets = await this.cacheManager.get<Offsets>("offsets");
    const cachedHour = await this.cacheManager.get<number>("hour");

    if (!cachedOffsets || cachedHour !== hour) {
      const offsets: Offsets = JSON.parse(
        readFileSync(join(process.cwd(), "resources/offsets.json")).toString()
      );

      const encryptedOffsets = transformOffsets(offsets, encrypt);

      await this.cacheManager.set("offsets", encryptedOffsets, 0);
      await this.cacheManager.set("hour", hour, 0);

      return encryptedOffsets;
    }

    return cachedOffsets;
  }
}
