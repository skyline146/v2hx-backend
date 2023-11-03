import { Module, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt/dist";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersModule } from "src/users/users.module";
import { LocalStrategy } from "./strategies/local-strategy";
import { JwtStrategy } from "./strategies/jwt-strategy";
import { RefreshJwtStrategy } from "./strategies/refreshToken-strategy";

@Module({
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshJwtStrategy],
  exports: [AuthService],
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: `${configService.get<string>("JWT_SECRET")}`,
        signOptions: {
          expiresIn: "1h",
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
