import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";

import { WinstonModule } from "nest-winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { transports, format } from "winston";
import { ZodValidationPipe, ZodSerializerInterceptor } from "nestjs-zod";
import { join } from "path";

import { TokenModule } from "./token/token.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { InfoModule } from "./info/info.module";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import typeorm from "./config/typeorm";
import { FastifyThrottlerGuard } from "./guards/throttler.guard";
import { AppGateway } from "./app.gateway";
import { PlayerlistModule } from "./playerlist/playerlist.module";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => configService.get("typeorm"),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
      load: [typeorm],
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 10,
      },
    ]),
    WinstonModule.forRoot({
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf((log) => `${log.timestamp} - [${log.level.toUpperCase()}]: ${log.message}`)
      ),
      transports: [
        new transports.Console(),
        new DailyRotateFile({
          dirname: join(process.cwd(), "logs"),
          filename: "%DATE%.log",
          datePattern: "DD-MM-YYYY",
          maxFiles: "14d",
        }),
      ],
    }),
    UsersModule,
    InfoModule,
    AuthModule,
    TokenModule,
    PlayerlistModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppGateway,
    { provide: APP_GUARD, useClass: FastifyThrottlerGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
