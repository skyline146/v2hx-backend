import { Inject } from "@nestjs/common";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

import { UsersService } from "src/users/users.service";

@WebSocketGateway({ namespace: "api/playing" })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private usersService: UsersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const username = client.handshake.query["username"] as string;

    const user = await this.usersService.findOne({ username });

    if (!user) {
      client.emit("error", JSON.stringify({ message: "User not found" }));
      client.disconnect();
      return;
    }

    if (user.ban) {
      client.emit("error", JSON.stringify({ message: "User banned" }));
      client.disconnect();
      return;
    }

    if (user.online) {
      this.usersService.update(username, { ban: true });
      this.logger.warn(`User ${username} tried to connect while session is active. Ban: true`);

      client.disconnect();
      return;
    }

    await this.usersService.update(username, { online: true });

    // console.log(`${client.handshake.query["username"]} is online now.`);
    // console.log(`Connected to socket: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const username = client.handshake.query["username"] as string;
    await this.usersService.update(username, { online: false });

    // console.log(`${client.handshake.query["username"]} is offline now.`);
    // console.log(`Disconnected from socket: ${client.id}`);
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() data: string): string {
    // console.log(data);

    this.server.emit("message", data);
    return data;
  }

  @SubscribeMessage("username")
  handleUserOnline(@MessageBody() username: string, @ConnectedSocket() client: Socket): string {
    console.log(`${username}, socket id: ${client.id}`);

    this.server.emit("message", username);
    return username;
  }
}
