import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as session from "express-session";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
// eslint-disable-next-line @typescript-eslint/no-var-requires

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const configService = app.get(ConfigService);

  const allowed_origins = process.env.ALLOWED_ORIGINS;
  app.enableCors({ origin: allowed_origins.split(","), credentials: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(
    session({
      secret: "asf123fhasnf1j3",
      resave: false,
      saveUninitialized: false,
    })
  );
  await app.listen(3000);
}
bootstrap();
