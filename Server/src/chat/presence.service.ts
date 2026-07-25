import { Injectable } from '@nestjs/common';

// In-memory presence tracking. Fine for a single server process at 10-20
// users. The moment you run more than one server instance (horizontal
// scaling), this state needs to live in Redis instead — otherwise
// instance A won't know a user is online if they connected to instance B.
// The public methods below are written so that swap only touches this
// file, nothing that calls it.
@Injectable()
export class PresenceService {
  // userId -> set of socket ids. A Set, not a single string, because one
  // user can have multiple tabs/devices connected at once.
  private onlineUsers = new Map<string, Set<string>>();

  setOnline(userId: string, socketId: string): void {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    const sockets = this.onlineUsers.get(userId)
    if (sockets) {
      sockets.add(socketId)
    }
  }

  setOffline(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
    }
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}