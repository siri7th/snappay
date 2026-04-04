import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
declare let io: SocketServer | null;
export declare const initializeSocket: (server: HttpServer) => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { io };
//# sourceMappingURL=socketService.d.ts.map