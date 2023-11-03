import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { InfoService } from "./info.service";
import { InfoDto } from "./dtos/info.dto";
import { AdminGuard } from "src/guards/admin.guard";

@Controller("info")
export class InfoController {
  constructor(private infoService: InfoService) {}

  @Get("")
  async getInfo() {
    const { version, status } = await this.infoService.get();

    return { version, status };
  }

  @UseGuards(AdminGuard)
  @Patch("")
  changeInfo(@Body() body: Partial<InfoDto>) {
    this.infoService.update(body);
  }
}
