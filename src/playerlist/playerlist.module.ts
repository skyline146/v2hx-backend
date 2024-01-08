import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PlayerlistController } from "./playerlist.controller";
import { PlayerlistService } from "./playerlist.service";
import { UsersModule } from "src/users/users.module";
import { AuthModule } from "src/auth/auth.module";
import { Playerlist } from "src/entities";

@Module({
  imports: [TypeOrmModule.forFeature([Playerlist]), UsersModule, AuthModule],
  controllers: [PlayerlistController],
  providers: [PlayerlistService],
})
export class PlayerlistModule {}
