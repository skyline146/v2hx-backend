import { Global, Module } from "@nestjs/common";

import { UsersModule } from "src/users/users.module";
import { WebSocketsGateway } from "./websockets.gateway";

@Global()
@Module({
  imports: [UsersModule],
  providers: [WebSocketsGateway],
  exports: [WebSocketsGateway],
})
export class WebsocketsModule {}
