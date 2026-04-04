import { initializeSocket, getIO, closeSocket, io } from '../config/socket';
export { initializeSocket, getIO, closeSocket, io };
declare const _default: {
    initializeSocket: (server: import("http").Server) => import("socket.io").Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    getIO: () => import("socket.io").Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    closeSocket: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=paymentService.d.ts.map