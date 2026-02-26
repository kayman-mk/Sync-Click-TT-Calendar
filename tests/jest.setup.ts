import 'reflect-metadata';

// snapshot the initial process-level listeners so we don't remove Jest's own handlers
const baselineUncaughtExceptionListeners = process.listeners('uncaughtException');
const baselineUnhandledRejectionListeners = process.listeners('unhandledRejection');

// Clean up Winston logger (and other test-added) listeners after each test to prevent memory leak warnings
afterEach(() => {
    // Remove uncaughtException listeners that were not present at startup
    process.listeners('uncaughtException').forEach(listener => {
        if (!baselineUncaughtExceptionListeners.includes(listener)) {
            process.off('uncaughtException', listener);
        }
    });

    // Remove unhandledRejection listeners that were not present at startup
    process.listeners('unhandledRejection').forEach(listener => {
        if (!baselineUnhandledRejectionListeners.includes(listener)) {
            process.off('unhandledRejection', listener);
        }
    });
});


