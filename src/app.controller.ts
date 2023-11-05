import { Controller, Get, Res, StreamableFile } from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import type { Response } from "express";

import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/loader")
  getLoader(@Res({ passthrough: true }) res: Response) {
    const file = createReadStream(join(process.cwd(), "V2HX.exe"));
    res.set({ "Content-Disposition": 'attachment; filename="V2HX.exe"' });

    return new StreamableFile(file);
  }
}
