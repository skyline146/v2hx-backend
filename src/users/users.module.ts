import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "../entities/user.entity";
import { UsersController } from "./users.controller";
import { InvitesController } from "./invites.controller";
import { UsersService } from "./users.service";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
  controllers: [UsersController, InvitesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
