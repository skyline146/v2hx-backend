import { Body, Controller, Get, Inject, Param, Patch, Res, Req, UseGuards } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { FastifyReply, FastifyRequest } from "fastify";
import { UseZodGuard, ZodSerializerDto } from "nestjs-zod";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { createReadStream, readFileSync } from "fs";
import { join } from "path";

import { InfoService } from "./info.service";
import { AdminGuard, ActiveUserGuard } from "src/guards";
import { getCurrentDate } from "src/lib";
import { transformOffsets } from "./lib";

import { InfoDto, OffsetsDto } from "./dtos";
import { Offsets } from "./types";

@Controller("info")
export class InfoController {
  constructor(
    private infoService: InfoService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
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
  @UseZodGuard("params", OffsetsDto)
  @Get("/offsets/:version")
  async getOffsets(@Req() req: FastifyRequest, @Param("version") version: string) {
    const { year, month, day, hour } = getCurrentDate();

    const cachedOffsets = await this.cacheManager.get<Offsets>(`offsets_${version}`);
    const cachedHour = await this.cacheManager.get<number>("hour");

    this.logger.info(
      `User ${req.user.username} received offsets. Version: ${version.toUpperCase()}`
    );

    if (!cachedOffsets || cachedHour !== hour) {
      const offsets: Offsets = JSON.parse(
        readFileSync(join(process.cwd(), `resources/offsets_${version}.json`)).toString()
      );

      const encryptedOffsets = transformOffsets(offsets, year * month * day * hour);

      await this.cacheManager.set(`offsets_${version}`, encryptedOffsets, 0);
      await this.cacheManager.set("hour", hour, 0);

      return encryptedOffsets;
    }

    return cachedOffsets;
  }
}
