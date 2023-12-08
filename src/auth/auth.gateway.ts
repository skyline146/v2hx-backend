import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";

import { UsersService } from "src/users/users.service";

@WebSocketGateway({ namespace: "api/playing" })
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private usersService: UsersService) {}

  @WebSocketServer() server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`${client.handshake.query["username"]} is online now.`);
    console.log(`Connected to socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`${client.handshake.query["username"]} is offline now.`);
    console.log(`Disconnected from socket: ${client.id}`);
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
