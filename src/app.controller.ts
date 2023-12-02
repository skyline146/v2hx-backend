import { Controller, Get, Res } from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import { FastifyReply } from "fastify";

import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/loader")
  getLoader(@Res() res: FastifyReply) {
    const file = createReadStream(join(process.cwd(), "V2HX.exe"));

    res.headers({
      "Content-Type": "application/x-msdownload",
      "Content-Disposition": 'attachment; filename="V2HX.exe"',
    });

    res.send(file);
  }
}
