import winston from 'winston';
export interface LoggerWithStream {
    info: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
    http: (message: string, meta?: any) => void;
    child: (bindings: any) => any;
    getWinstonLogger: () => winston.Logger;
    stream: {
        write: (message: string) => void;
    };
}
export declare const logger: LoggerWithStream;
export default logger;
//# sourceMappingURL=logger.d.ts.map