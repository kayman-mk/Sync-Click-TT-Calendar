/**
 * Interface for logging functionality
 */
export interface Logger {
    /**
     * Log an error message
     */
    error(message: any): void;

    /**
     * Log a warning message
     */
    warning(message: any): void;

    /**
     * Log an info message
     */
    info(message: any): void;

    /**
     * Log a debug message
     */
    debug(message: any): void;

    /**
     * Log a trace message
     */
    trace(message: any): void;
}

