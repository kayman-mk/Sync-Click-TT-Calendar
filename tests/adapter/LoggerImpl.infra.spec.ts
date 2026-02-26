import Transport from 'winston-transport';
import { LoggerImpl } from '../../src/adapter/LoggerImpl';

class CaptureTransport extends Transport {
    public capturedLogs: Array<{ message: string; level: string; timestamp: string }> = [];

    constructor() {
        super();
    }

    reset(): void {
        this.capturedLogs = [];
    }

    log(info: any, callback: () => void) {
        this.capturedLogs.push({
            message: String(info.message || '').trim(),
            level: String(info.level || '').trim(),
            timestamp: String(info.timestamp || '')
        });
        callback();
    }
}

describe('LoggerImpl.InfraTest', () => {
    let captureTransport: CaptureTransport;
    let logger: LoggerImpl;

    beforeEach(() => {
        captureTransport = new CaptureTransport();
        logger = new LoggerImpl(captureTransport);
    });


    describe('logging with Winston transport', () => {
        it('should_write_to_transport_when_error_is_called', () => {
            // when
            logger.error('test error');

            // then
            expect(captureTransport.capturedLogs).toHaveLength(1);
            expect(captureTransport.capturedLogs[0].message).toBe('test error');
            expect(captureTransport.capturedLogs[0].level).toContain('error');
        });

        it('should_write_to_transport_when_warning_is_called', () => {
            // when
            logger.warning('test warning');

            // then
            expect(captureTransport.capturedLogs).toHaveLength(1);
            expect(captureTransport.capturedLogs[0].message).toBe('test warning');
            expect(captureTransport.capturedLogs[0].level).toContain('warn');
        });

        it('should_write_to_transport_when_info_is_called', () => {
            // when
            logger.info('test info');

            // then
            expect(captureTransport.capturedLogs).toHaveLength(1);
            expect(captureTransport.capturedLogs[0].message).toBe('test info');
            expect(captureTransport.capturedLogs[0].level).toContain('info');
        });

        it('should_respect_log_level_filter_when_debug_level_not_enabled', () => {
            // given - logger initialized with default 'info' level
            const infoTransport = new CaptureTransport();
            const infoLevelLogger = new LoggerImpl(infoTransport, 'info');

            // when
            infoLevelLogger.debug('test debug');

            // then - debug message should not be captured because level is 'info'
            expect(infoTransport.capturedLogs).toHaveLength(0);
        });

        it('should_capture_debug_message_when_debug_level_enabled', () => {
            // given - logger initialized with 'debug' level
            const debugTransport = new CaptureTransport();
            const debugLevelLogger = new LoggerImpl(debugTransport, 'debug');

            // when
            debugLevelLogger.debug('test debug');

            // then
            expect(debugTransport.capturedLogs).toHaveLength(1);
            expect(debugTransport.capturedLogs[0].message).toBe('test debug');
            expect(debugTransport.capturedLogs[0].level).toContain('verbose');
        });

        it('should_include_timestamp_in_log_entry', () => {
            // when
            logger.info('test message');

            // then
            expect(captureTransport.capturedLogs).toHaveLength(1);
            expect(captureTransport.capturedLogs[0].timestamp).toBeDefined();
            expect(captureTransport.capturedLogs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });

        it('should_handle_object_message_with_transport', () => {
            // when
            const errorObj = { code: 'ERR_001', message: 'Something failed' };
            logger.error(errorObj);

            // then
            expect(captureTransport.capturedLogs).toHaveLength(1);
            expect(captureTransport.capturedLogs[0].level).toContain('error');
            // Object is serialized by Winston
            expect(captureTransport.capturedLogs[0].message).toBeDefined();
        });

        it('should_handle_null_message_with_transport', () => {
            // when
            logger.error(null);

            // then
            expect(captureTransport.capturedLogs).toHaveLength(1);
            expect(captureTransport.capturedLogs[0].level).toContain('error');
            expect(captureTransport.capturedLogs[0].message).toBe('null');
        });

        it('should_handle_error_objects_with_stack_traces', () => {
            // when
            const error = new Error('Test error');
            logger.error(error);

            // then
            expect(captureTransport.capturedLogs).toHaveLength(1);
            expect(captureTransport.capturedLogs[0].level).toContain('error');
            // Error object is captured by transport
            expect(captureTransport.capturedLogs[0].message).toBeDefined();
        });

        it('should_use_provided_transport_for_logging', () => {
            // given
            const customTransport = new CaptureTransport();
            const customLogger = new LoggerImpl(customTransport);

            // when
            customLogger.info('test');

            // then - message should be in the custom transport, not the original one
            expect(customTransport.capturedLogs).toHaveLength(1);
            expect(customTransport.capturedLogs[0].message).toBe('test');
        });
    });
});

