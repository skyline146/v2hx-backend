import { NestFactory, Reflector } from "@nestjs/core";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCors from "@fastify/cors";
import cookieParser from "cookie-parser";
import fastifyCookie from "@fastify/cookie";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  // const app = await NestFactory.create(AppModule);

  const allowed_origins = process.env.ALLOWED_ORIGINS;
  // app.enableCors({ origin: allowed_origins.split(","), credentials: true });
  app.register(fastifyCors, { origin: allowed_origins.split(","), credentials: true });

  app.setGlobalPrefix("/api");

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // app.use(cookieParser());

  await app.register(fastifyCookie, {
    secret: "secret-key",
  });

  await app.listen(3000, "0.0.0.0");
}
bootstrap();
