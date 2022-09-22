import winston from 'winston';
import { Configuration } from "./Configuration";

export class Logger {
    private logger: winston.Logger;

    constructor(configuration: Configuration) {
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console(),
            ]
        });
    }
}