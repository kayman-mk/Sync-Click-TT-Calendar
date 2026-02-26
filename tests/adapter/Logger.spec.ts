import Transport from 'winston-transport'
import { LoggerImpl } from "../../src/adapter/LoggerImpl";

class MockTransport extends Transport {
    public logs: Array<{ message: string; level: string }> = [];

    constructor() {
        super();
    }

    reset(): void {
        this.logs = [];
    }

    log(info: any, callback: () => void) {
        let message: string;


        // Try to get the message from various sources
        if (info.message && typeof info.message === 'string' && !info.message.includes('[object Object]')) {
            message = info.message.trim();
        } else {
            // If message is stringified object, try to find the actual object
            // Exclude winston internal properties
            const { message: msg, level: lvl, timestamp, symbol, splat, ...rest } = info;
            // If there are other properties, stringify them
            if (Object.keys(rest).length > 0) {
                message = JSON.stringify(rest);
            } else {
                message = String(info.message || '');
            }
        }

        this.logs.push({
            message,
            level: String(info.level).trim()
        });
        callback();
    }
}

describe('LoggerImpl', () => {
    let mockTransport: MockTransport;
    let logger: LoggerImpl;

    beforeEach(() => {
        mockTransport = new MockTransport();
        logger = new LoggerImpl(mockTransport);
    });

    describe('error', () => {
        it('should_write_error_message_when_error_is_called', () => {
            // when
            logger.error('error message');

            // then
            expect(mockTransport.logs).toHaveLength(1);
            expect(mockTransport.logs[0].message).toBe('error message');
            expect(mockTransport.logs[0].level).toContain('error');
        });

        it('should_handle_object_messages_when_error_is_called', () => {
            // when
            const errorObj = { code: 'ERR001', details: 'Something went wrong' };
            logger.error(errorObj);

            // then
            expect(mockTransport.logs).toHaveLength(1);
            // Winston will log the object - the exact representation depends on how it serializes
            expect(mockTransport.logs[0].level).toContain('error');
        });

        it('should_handle_null_message_in_error_logging', () => {
            // when
            logger.error(null);

            // then
            expect(mockTransport.logs).toHaveLength(1);
            expect(mockTransport.logs[0].message).toBe('null');
            expect(mockTransport.logs[0].level).toContain('error');
        });
    });

    describe('warning', () => {
        it('should_write_warning_message_when_warning_is_called', () => {
            // when
            logger.warning('warning message');

            // then
            expect(mockTransport.logs).toHaveLength(1);
            expect(mockTransport.logs[0].message).toBe('warning message');
            expect(mockTransport.logs[0].level).toContain('warn');
        });

        it('should_handle_object_messages_when_warning_is_called', () => {
            // when
            const warningObj = { code: 'WARN001', message: 'Be careful' };
            logger.warning(warningObj);

            // then
            expect(mockTransport.logs).toHaveLength(1);
            // Winston will log the object - the exact representation depends on how it serializes
            expect(mockTransport.logs[0].level).toContain('warn');
        });
    });

    describe('info', () => {
        it('should_write_info_message_when_info_is_called', () => {
            // when
            logger.info('info message');

            // then
            expect(mockTransport.logs).toHaveLength(1);
            expect(mockTransport.logs[0].message).toBe('info message');
            expect(mockTransport.logs[0].level).toContain('info');
        });

        it('should_handle_object_messages_when_info_is_called', () => {
            // when
            const infoObj = { action: 'sync_started', timestamp: '2024-01-01' };
            logger.info(infoObj);

            // then
            expect(mockTransport.logs).toHaveLength(1);
            // Winston will log the object - the exact representation depends on how it serializes
            expect(mockTransport.logs[0].level).toContain('info');
        });
    });

    describe('debug', () => {
        it('should_call_transport_with_debug_level_when_debug_is_called', () => {
            // given
            const transportWithDebugLevel = new MockTransport();
            const loggerWithDebugLevel = new LoggerImpl(transportWithDebugLevel, 'debug');

            // when
            loggerWithDebugLevel.debug('debug message');

            // then
            expect(transportWithDebugLevel.logs).toHaveLength(1);
            expect(transportWithDebugLevel.logs[0].message).toBe('debug message');
            expect(transportWithDebugLevel.logs[0].level).toContain('verbose');
        });
    });

    describe('trace', () => {
        it('should_call_transport_with_debug_level_when_trace_is_called', () => {
            // given
            const transportWithDebugLevel = new MockTransport();
            const loggerWithDebugLevel = new LoggerImpl(transportWithDebugLevel, 'debug');

            // when
            loggerWithDebugLevel.trace('trace message');

            // then
            expect(transportWithDebugLevel.logs).toHaveLength(1);
            expect(transportWithDebugLevel.logs[0].message).toBe('trace message');
            expect(transportWithDebugLevel.logs[0].level).toContain('debug');
        });
    });

    describe('multiple messages', () => {
        it('should_log_multiple_messages_in_sequence', () => {
            // when
            logger.info('first');
            logger.warning('second');
            logger.error('third');

            // then
            expect(mockTransport.logs).toHaveLength(3);
            expect(mockTransport.logs[0].message).toBe('first');
            expect(mockTransport.logs[0].level).toContain('info');
            expect(mockTransport.logs[1].message).toBe('second');
            expect(mockTransport.logs[1].level).toContain('warn');
            expect(mockTransport.logs[2].message).toBe('third');
            expect(mockTransport.logs[2].level).toContain('error');
        });
    });

    describe('with custom log level', () => {
        it('should_respect_custom_log_level_parameter', () => {
            // given
            const transportWithDebugLevel = new MockTransport();

            // when
            const loggerWithDebugLevel = new LoggerImpl(transportWithDebugLevel, 'debug');
            loggerWithDebugLevel.debug('debug message');

            // then
            expect(transportWithDebugLevel.logs).toHaveLength(1);
            expect(transportWithDebugLevel.logs[0].level).toContain('verbose');
        });

        it('should_use_default_info_level_when_not_specified', () => {
            // when
            logger.info('info message');

            // then
            expect(mockTransport.logs).toHaveLength(1);
            expect(mockTransport.logs[0].level).toContain('info');
        });
    });
});
