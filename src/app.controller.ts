import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import { FastifyReply } from "fastify";

import { AppService } from "./app.service";
import { JwtAuthGuard } from "./auth/guards";
import { ActiveUserGuard } from "./guards";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard, ActiveUserGuard)
  @Get("/loader")
  getLoader(@Res() res: FastifyReply) {
    const file = createReadStream(join(process.cwd(), "resources/V2HX.exe"));

    res.headers({
      "Content-Type": "application/x-msdownload",
      "Content-Disposition": 'attachment; filename="V2HX.exe"',
    });

    res.send(file);
  }
}
