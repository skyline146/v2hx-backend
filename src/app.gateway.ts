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
// import { parse, URL } from "url";
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

import { UsersService } from "src/users/users.service";

@WebSocketGateway({ path: "api/playing" })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private usersService: UsersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @WebSocketServer() server: Server;

  private clients: Map<string, WebSocket> = new Map();

  async handleConnection(client: WebSocket, req: IncomingMessage) {
    // console.log(client);
    // const username = new URL(req.url, "http://localhost:7142").searchParams.get("username");
    // console.log(`Connected user: ${username}`);
    // // const username = client.handshake.query["username"] as string;
    // const user = await this.usersService.findOne({ username });
    // if (!user) {
    //   ws.close(1011, "User not found");
    //   return;
    // }
    // if (user.ban) {
    //   ws.close(1011, "User banned");
    //   return;
    // }
    // if (user.online) {
    //   this.usersService.update(username, { ban: true });
    //   this.logger.warn(`User ${username} tried to connect while session is active. Ban: true`);
    //   ws.close(1011, "Session is active already");
    //   return;
    // }
    // ws.send("hello from websocket");
    // this.server.clients.forEach((client) => client.send("hello from server"));
    // await this.usersService.update(username, { online: true });
    // ws.on("close", async () => {
    //   await this.usersService.update(username, { online: false });
    //   console.log(`Connection closed on user: ${username}`);
    // });
    // console.log(`${client.handshake.query["username"]} is online now.`);
    // console.log(`Connected to socket: ${client.id}`);
  }

  async handleDisconnect(client: WebSocket) {
    const username = this.getUsernameByClient(client);

    this.clients.delete(username);
    await this.usersService.update(username, { online: false });
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() data: string): string {
    console.log("message event");

    this.server.emit("message", data);
    return data;
  }

  @SubscribeMessage("username")
  async handleUserOnline(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() username: string
  ): Promise<void> {
    const user = await this.usersService.findOne({ username });

    if (!user) {
      client.close(1011, "User not found");
      return;
    }

    if (user.ban) {
      client.close(1011, "User banned");
      return;
    }

    if (user.online) {
      this.usersService.update(username, { ban: true });
      this.logger.warn(`User ${username} tried to connect while session is active. Ban: true`);

      client.close(1011, "Session is active already");
      return;
    }

    this.clients.set(username, client);
    await this.usersService.update(username, { online: true });
  }

  private getUsernameByClient(client: WebSocket): string | undefined {
    for (const [username, c] of this.clients) {
      if (c === client) {
        return username;
      }
    }
    return undefined;
  }
}
