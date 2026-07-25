import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, BadRequestException } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' }, // tighten to your actual frontend origin before going live
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Attach userId to the socket instance so every later handler
      // (message send, typing, etc.) knows who this connection belongs
      // to without re-verifying the token on every single event.
      client.data.userId = userId;

      // Each user joins a "personal room" named after their own id. This
      // is what makes 1-on-1 delivery simple: to reach a user you just
      // emit to room(userId) — you never have to look up or track which
      // specific socket belongs to them, even across multiple tabs.
      client.join(userId);

      this.presenceService.setOnline(userId, client.id);

      client.broadcast.emit('presence:update', {
        userId,
        status: 'online',
      });

      this.logger.log(`Connected: user ${userId}, socket ${client.id}`);
    } catch (err: any) {
      this.logger.warn(`Connection rejected: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    this.presenceService.setOffline(userId, client.id);

    // Only announce "offline" if that was their last active connection —
    // don't flip them offline just because they closed one of two tabs.
    if (!this.presenceService.isOnline(userId)) {
      client.broadcast.emit('presence:update', {
        userId,
        status: 'offline',
        lastSeenAt: new Date(),
      });
    }

    this.logger.log(`Disconnected: user ${userId}, socket ${client.id}`);
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody()
    body: { conversationId?: string; recipientId?: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.userId;
    if (!senderId) {
      throw new BadRequestException('Unauthorized');
    }

    const result = await this.chatService.sendMessage(senderId, {
      conversationId: body.conversationId,
      recipientId: body.recipientId,
      content: body.content,
    });

    const eventPayload = {
      message: result.message,
      conversationId: result.conversationId,
      senderId,
      recipientId: result.recipientId,
    };

    client.emit('message:sent', eventPayload);

    if (result.recipientId) {
      this.server.to(result.recipientId).emit('message:new', eventPayload);
    }

    return eventPayload;
  }

  // Client connects with: io(URL, { auth: { token: 'Bearer <jwt>' } })
  private extractToken(client: Socket): string {
    const raw = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!raw) throw new Error('No auth token provided');
    return raw.replace('Bearer ', '');
  }
}