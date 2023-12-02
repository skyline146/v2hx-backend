import { NestFactory, Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  // const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const allowed_origins = configService.get<string>("ALLOWED_ORIGINS");
  app.register(fastifyCors, { origin: allowed_origins.split(","), credentials: true });

  await app.register(fastifyCookie, {
    secret: configService.get<string>("COOKIE_SECRET"),
  });

  app.setGlobalPrefix("/api");

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(3000, "0.0.0.0");
}
bootstrap();
