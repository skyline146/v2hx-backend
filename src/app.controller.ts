import { Controller, Get, Res } from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import { FastifyReply } from "fastify";
import { authenticate } from "@xboxreplay/xboxlive-auth";

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
    const file = createReadStream(join(process.cwd(), "resources/V2HX.exe"));

    res.headers({
      "Content-Type": "application/x-msdownload",
      "Content-Disposition": 'attachment; filename="V2HX.exe"',
    });

    res.send(file);
  }

  @Get("/xbox-api-test")
  async test() {
    //t
    const userData = await authenticate("test@v2hx.pro", "admin36786921397");

    console.log(userData);

    return userData;
  }
}
