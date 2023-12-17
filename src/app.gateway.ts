import { Inject } from "@nestjs/common";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parse, URL } from "url";
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

import { UsersService } from "src/users/users.service";

@WebSocketGateway({ path: "api/playing" })
export class AppGateway {
  constructor(
    private usersService: UsersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage("connection")
  async handleConnection(ws: WebSocket, req: IncomingMessage) {
    const username = new URL(req.url, "http://localhost:7142").searchParams.get("username");
    console.log(`Connected user: ${username}`);

    // const username = client.handshake.query["username"] as string;

    const user = await this.usersService.findOne({ username });

    if (!user) {
      ws.close(1011, "User not found");
      return;
    }

    if (user.ban) {
      ws.close(1011, "User banned");
      return;
    }

    if (user.online) {
      this.usersService.update(username, { ban: true });
      this.logger.warn(`User ${username} tried to connect while session is active. Ban: true`);

      ws.close(1011, "Session is active already");
      return;
    }

    ws.send("hello from websocket");
    this.server.clients.forEach((client) => client.send("hello from server"));

    await this.usersService.update(username, { online: true });

    ws.on("close", async () => {
      await this.usersService.update(username, { online: false });
      console.log(`Connection closed on user: ${username}`);
    });

    // console.log(`${client.handshake.query["username"]} is online now.`);
    // console.log(`Connected to socket: ${client.id}`);
  }

  @SubscribeMessage("close")
  async handleDisconnect(client: WebSocket) {
    // this.server.on;
    // console.log("connection closed");
    // console.log(this.server.clients.size);
    // const username = client.handshake.query["username"] as string;
    // await this.usersService.update(username, { online: false });
    // console.log(`${client.handshake.query["username"]} is offline now.`);
    // console.log(`Disconnected from socket: ${client.id}`);
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() data: string): string {
    console.log("message event");

    this.server.emit("message", data);
    return data;
  }

  @SubscribeMessage("username")
  handleUserOnline(@MessageBody() username: string): string {
    console.log("username event");
    // console.log(`${username}, socket id: ${client.id}`);
    return username;
  }
}
