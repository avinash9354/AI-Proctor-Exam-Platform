interface Peer {
  id: string;
  role: 'primary' | 'secondary';
  joinedAt: Date;
}

interface Room {
  sessionId: string;
  peers: Peer[];
  createdAt: Date;
}

class RoomManager {
  private rooms = new Map<string, Room>();
  private peerToRoom = new Map<string, string>();

  async getOrCreateRoom(sessionId: string): Promise<Room> {
    if (!this.rooms.has(sessionId)) {
      this.rooms.set(sessionId, {
        sessionId,
        peers: [],
        createdAt: new Date(),
      });
    }
    return this.rooms.get(sessionId)!;
  }

  async getRoom(sessionId: string): Promise<Room | undefined> {
    return this.rooms.get(sessionId);
  }

  addPeer(sessionId: string, peerId: string, role: 'primary' | 'secondary'): void {
    const room = this.rooms.get(sessionId);
    if (room) {
      room.peers.push({ id: peerId, role, joinedAt: new Date() });
      this.peerToRoom.set(peerId, sessionId);
    }
  }

  removePeer(peerId: string): void {
    const sessionId = this.peerToRoom.get(peerId);
    if (sessionId) {
      const room = this.rooms.get(sessionId);
      if (room) {
        room.peers = room.peers.filter((p) => p.id !== peerId);
        if (room.peers.length === 0) {
          this.rooms.delete(sessionId);
        }
      }
      this.peerToRoom.delete(peerId);
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.rooms.keys());
  }
}

export const roomManager = new RoomManager();
