import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { InfoService } from "./info.service";
import { InfoDto } from "./dtos/info.dto";
import { AdminGuard } from "src/guards/admin.guard";

@Controller("info")
export class InfoController {
  constructor(private infoService: InfoService) {}

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
  getOffsets() {
    return true;
  }

  @UseGuards(AdminGuard)
  @Patch("/offsets")
  changeOffsets(@Body() body: Partial<InfoDto>) {
    return this.infoService.update(body);
  }
}
