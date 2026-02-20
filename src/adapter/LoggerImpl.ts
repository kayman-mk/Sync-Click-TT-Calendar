
import { injectable } from 'inversify';
import winston, { format } from 'winston';

@injectable()
export class LoggerImpl {
    private logger: winston.Logger;

    constructor(transport: winston.transport) {
        this.logger = winston.createLogger({
            format: format.combine(format.errors({ stack: true }), format.timestamp(), format.cli()),
            level: 'info',
            transports: [
                transport
            ],
            exceptionHandlers: [
                transport
            ],
            rejectionHandlers: [
                transport
            ],
        });
    }

    error(message: any) {
        this.logger.error(message);
    }

    warning(message: any) {
        this.logger.warn(message);
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
