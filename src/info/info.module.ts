import { Module, forwardRef } from "@nestjs/common";
import { InfoController } from "./info.controller";
import { InfoService } from "./info.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Info } from "../entities/info.entity";
import { AuthModule } from "src/auth/auth.module";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Info]), AuthModule, forwardRef(() => UsersModule)],
  controllers: [InfoController],
  providers: [InfoService],
  exports: [InfoService],
})
export class InfoModule {}
