import { Module } from "@nestjs/common";
import { InfoController } from "./info.controller";
import { InfoService } from "./info.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Info } from "../entities/info.entity";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Info]), AuthModule],
  controllers: [InfoController],
  providers: [InfoService],
})
export class InfoModule {}
