import { Module, forwardRef } from "@nestjs/common";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersModule } from "src/users/users.module";
import { AuthGateway } from "./auth.gateway";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGateway],
  exports: [AuthService],
  imports: [forwardRef(() => UsersModule)],
})
export class AuthModule {}
