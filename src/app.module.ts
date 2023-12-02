import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { WinstonModule } from "nest-winston";
import winston from "winston";
import { join } from "path";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { InfoModule } from "./info/info.module";
import typeorm from "./config/typeorm";
import { FastifyThrottlerGuard } from "./guards/throttler.guard";

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
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 10,
      },
    ]),
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp({ format: new Date().toLocaleString() }),
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
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: FastifyThrottlerGuard }],
})
export class AppModule {}
