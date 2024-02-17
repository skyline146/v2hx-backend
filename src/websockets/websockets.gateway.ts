import { Inject, Injectable } from "@nestjs/common";
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
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";

import { UsersService } from "src/users/users.service";
import { LoginUserByHwidsDto } from "src/auth/dtos";
import { decryptMagicValue, parseHwid } from "src/lib";

@Injectable()
@WebSocketGateway({ path: "api/playing" })
export class WebSocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private usersService: UsersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  @WebSocketServer() server: Server;

  private clients: Map<string, WebSocket> = new Map();

  private getUsernameByClient(client: WebSocket): string | undefined {
    for (const [username, c] of this.clients) {
      if (c === client) {
        return username;
      }
    }
    return undefined;
  }

  disconnectClient(username: string) {
    this.clients.get(username).terminate();
  }

  emitClientEvent(username: string, event: string, data: any) {
    const client = this.clients.get(username);

    if (!client) {
      return null;
    }

    client.send(JSON.stringify({ event, data: { username, ...data } }));
  }

  async handleConnection(client: WebSocket, req: IncomingMessage) {
    const pingInterval = setInterval(() => {
      client.ping(`Server ping: ${new Date(Date.now()).toTimeString()}`);
    }, 20000);

    const pingTimeout = setTimeout(() => {
      console.log(`Client ${client} did not respond to ping, disconnecting...`);
      client.terminate();
    }, 30000);

    client.on("pong", () => {
      clearTimeout(pingTimeout);
    });

    client.on("close", () => {
      clearInterval(pingInterval);
      clearTimeout(pingTimeout);
    });
  }

  async handleDisconnect(client: WebSocket) {
    const username = this.getUsernameByClient(client);

    this.logger.info(`User ${username} disconnected from WebSocket.`);
    this.clients.delete(username);
    await this.usersService.update(username, { online: false });
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() test: any): string {
    console.log("message event");

    console.log(test);

    this.server.emit("test", test);
    return test;
  }

  @SubscribeMessage("login")
  async handleUserLogin(
    @ConnectedSocket() connectedClient: WebSocket,
    @MessageBody() data: LoginUserByHwidsDto
  ): Promise<void> {
    const { a, c } = data;

    const magicValue = decryptMagicValue(c);
    const loginHdd = parseHwid(a, magicValue);
    // const loginMacAddress = parseHwid(b);

    try {
      await this.usersService.findOne({ hdd: loginHdd });
    } catch (err) {
      connectedClient.close(1007, "Invalid login data");
      return;
    }

    const user = await this.usersService.findOne({ hdd: loginHdd });

    if (!user) {
      connectedClient.close(1011, "User not found");
      return;
    }

    if (user.ban) {
      connectedClient.close(1011, "User banned");
      this.logger.warn(`User ${user.username} tried to connect while banned.`);
      return;
    }

    const existedClient = this.clients.get(user.username);

    if (existedClient) {
      this.usersService.update(user.username, { ban: true, online: false });
      this.logger.warn(`User ${user.username} tried to connect while session is active. Ban: TRUE`);

      connectedClient.close(1011, "Session is active already");
      existedClient.close(1011, "Session is active already");
      this.clients.delete(user.username);

      return;
    }

    this.logger.info(`User ${user.username} connected to WebSocket.`);
    this.clients.set(user.username, connectedClient);
    await this.usersService.update(user.username, { online: true });
  }

  @SubscribeMessage("username")
  async handleUserOnline(
    @ConnectedSocket() connectedClient: WebSocket,
    @MessageBody() username: string
  ): Promise<void> {
    const user = await this.usersService.findOne({ username });

    if (!user) {
      connectedClient.close(1011, "User not found");
      return;
    }

    if (user.ban) {
      connectedClient.close(1011, "User banned");
      return;
    }

    const existedClient = this.clients.get(user.username);

    if (existedClient) {
      this.usersService.update(username, { ban: true, online: false });
      this.logger.warn(`User ${username} tried to connect while session is active. Ban: TRUE`);

      connectedClient.close(1011, "Session is active already");
      existedClient.close(1011, "Session is active already");
      this.clients.delete(user.username);

      return;
    }

    this.logger.info(`User ${user.username} connected to WebSocket.`);
    this.clients.set(username, connectedClient);
    await this.usersService.update(username, { online: true });
  }
}
