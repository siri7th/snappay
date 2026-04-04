"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.closeSocket = exports.getIO = exports.initializeSocket = void 0;
const socket_1 = require("../config/socket");
Object.defineProperty(exports, "initializeSocket", { enumerable: true, get: function () { return socket_1.initializeSocket; } });
Object.defineProperty(exports, "getIO", { enumerable: true, get: function () { return socket_1.getIO; } });
Object.defineProperty(exports, "closeSocket", { enumerable: true, get: function () { return socket_1.closeSocket; } });
Object.defineProperty(exports, "io", { enumerable: true, get: function () { return socket_1.io; } });
exports.default = { initializeSocket: socket_1.initializeSocket, getIO: socket_1.getIO, closeSocket: socket_1.closeSocket };
//# sourceMappingURL=paymentService.js.map