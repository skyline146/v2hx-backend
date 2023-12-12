import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { WinstonModule } from "nest-winston";
import winston from "winston";
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
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(
          (log) => `${log.timestamp} - [${log.level.toUpperCase()}]: ${log.message}`
        )
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          dirname: join(process.cwd(), "src"),
          filename: "logs.log",
        }),
      ],
    }),
    UsersModule,
    InfoModule,
    AuthModule,
    TokenModule,
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
