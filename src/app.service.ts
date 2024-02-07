import { Injectable, BeforeApplicationShutdown } from "@nestjs/common";

import { logToDiscord } from "./lib";

@Injectable()
export class AppService implements BeforeApplicationShutdown {
  async beforeApplicationShutdown(signal?: string) {
    await logToDiscord(`Server stopped. Signal: ${signal} [${process.env.ENVIRONMENT}]`, 15548997);
  }

  getHello(): string {
    return "Hello World!";
  }
}
