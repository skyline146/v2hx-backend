import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { WsAdapter } from "@nestjs/platform-ws";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, ignoreTrailingSlash: true })
  );

  app.useWebSocketAdapter(new WsAdapter(app));

  const configService = app.get(ConfigService);

  const allowed_origins = configService.get<string>("ALLOWED_ORIGINS");
  app.register(fastifyCors, { origin: allowed_origins.split(","), credentials: true });

  await app.register(fastifyCookie, {
    secret: configService.get<string>("COOKIE_SECRET"),
  });

  app.setGlobalPrefix("/api");

  await app.listen(7142, "0.0.0.0");
}
bootstrap();
