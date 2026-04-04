import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
declare let io: SocketServer | null;
export declare const initializeSocket: (server: HttpServer) => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const closeSocket: () => Promise<void>;
export { io };
declare const _default: {
    initializeSocket: (server: HttpServer) => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    getIO: () => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    closeSocket: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=socket.d.ts.map