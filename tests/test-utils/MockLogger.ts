import { Logger } from '../../src/domain/service/Logger';

/**
 * Mock logger implementation for testing.
 * Implements the Logger interface with no-op methods suitable for unit tests.
 */
export class MockLogger implements Logger {
    public errors: any[] = [];
    public warnings: any[] = [];
    public infos: any[] = [];
    public debugs: any[] = [];
    public traces: any[] = [];

    error(message: any): void {
        this.errors.push(message);
    }

    warning(message: any): void {
        this.warnings.push(message);
    }

    info(message: any): void {
        this.infos.push(message);
    }

    debug(message: any): void {
        this.debugs.push(message);
    }

    trace(message: any): void {
        this.traces.push(message);
    }

    /**
     * Reset all collected messages.
     * Useful in beforeEach hooks to clear state between tests.
     */
    reset(): void {
        this.errors = [];
        this.warnings = [];
        this.infos = [];
        this.debugs = [];
        this.traces = [];
    }

    /**
     * Get all collected messages in a single array, ordered by log level.
     */
    getAllMessages(): any[] {
        return [
            ...this.errors,
            ...this.warnings,
            ...this.infos,
            ...this.debugs,
            ...this.traces,
        ];
    }
}

