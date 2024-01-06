import { Module } from "@nestjs/common";
import { PlayerlistController } from "./playerlist.controller";
import { PlayerlistService } from "./playerlist.service";

@Module({
  controllers: [PlayerlistController],
  providers: [PlayerlistService],
})
export class PlayerlistModule {}
