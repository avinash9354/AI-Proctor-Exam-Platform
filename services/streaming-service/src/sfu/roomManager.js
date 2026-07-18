"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomManager = void 0;
class RoomManager {
    rooms = new Map();
    peerToRoom = new Map();
    async getOrCreateRoom(sessionId) {
        if (!this.rooms.has(sessionId)) {
            this.rooms.set(sessionId, {
                sessionId,
                peers: [],
                createdAt: new Date(),
            });
        }
        return this.rooms.get(sessionId);
    }
    async getRoom(sessionId) {
        return this.rooms.get(sessionId);
    }
    addPeer(sessionId, peerId, role) {
        const room = this.rooms.get(sessionId);
        if (room) {
            room.peers.push({ id: peerId, role, joinedAt: new Date() });
            this.peerToRoom.set(peerId, sessionId);
        }
    }
    removePeer(peerId) {
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
    getActiveSessions() {
        return Array.from(this.rooms.keys());
    }
}
exports.roomManager = new RoomManager();
//# sourceMappingURL=roomManager.js.map