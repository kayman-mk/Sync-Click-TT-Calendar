import Transport from 'winston-transport'
import { LoggerImpl } from "../../src/adapter/LoggerImpl";

class TestStringTransport extends Transport {
    public lines: string[] = []

    constructor() {
        super()
    }

    reset(): void {
        this.lines = []
    }

    log(info: unknown, callback: () => void) {
        if (typeof info === "string") {
            this.lines.push(info)
        } else {
            this.lines.push(JSON.stringify(info))
        }

        callback()
    }
};

describe('Logger', () => {
    const loggerOutput = new TestStringTransport()
    const logger = new LoggerImpl(loggerOutput)

    beforeEach(() => {
        loggerOutput.reset();
    })

    it('should write an error message to the log', () => {
        // when
        logger.error('error');

        // then
        expect(JSON.parse(loggerOutput.lines[0]).message.trim()).toEqual("error");
        expect(JSON.parse(loggerOutput.lines[0]).level.trim()).toContain("error");
    })

    it('should write a warning message to the log', () => {
        // when
        logger.warn('warning');

        // then
        expect(JSON.parse(loggerOutput.lines[0]).message.trim()).toEqual("warning");
        expect(JSON.parse(loggerOutput.lines[0]).level.trim()).toContain("warn");
    })

    it('should write an info message to the log', () => {
        // when
        logger.info('info');

        // then
        expect(JSON.parse(loggerOutput.lines[0]).message.trim()).toEqual("info");
        expect(JSON.parse(loggerOutput.lines[0]).level.trim()).toContain("info");
    })
})