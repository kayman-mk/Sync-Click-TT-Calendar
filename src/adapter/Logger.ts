
import { injectable } from 'inversify';
import winston, { format } from 'winston';

@injectable()
export class Logger {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            format: format.combine(format.errors({ stack: true }), format.timestamp(), format.prettyPrint()),
            level: 'info',
            transports: [
                new winston.transports.Console(),
            ],
            exceptionHandlers: [
                new winston.transports.Console(),
            ],
            rejectionHandlers: [
                new winston.transports.Console(),
            ],
        });
    }

    error(message: any) {
        this.logger.error(message);
    }

    warning(message: any) {
        this.logger.warning(message);
    }

    info(message: any) {
        this.logger.info(message);
    }

    debug(message: any) {
        this.logger.verbose(message);
    }

    trace(message: any) {
        this.logger.debug(message);
    }
}