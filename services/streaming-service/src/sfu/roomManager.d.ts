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
declare class RoomManager {
    private rooms;
    private peerToRoom;
    getOrCreateRoom(sessionId: string): Promise<Room>;
    getRoom(sessionId: string): Promise<Room | undefined>;
    addPeer(sessionId: string, peerId: string, role: 'primary' | 'secondary'): void;
    removePeer(peerId: string): void;
    getActiveSessions(): string[];
}
export declare const roomManager: RoomManager;
export {};
//# sourceMappingURL=roomManager.d.ts.map