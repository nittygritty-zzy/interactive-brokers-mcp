import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
// File-based logging utility that never interferes with MCP protocol
export class Logger {
    static logDir = process.env.IB_MCP_LOG_DIR || join(homedir(), '.ib-mcp');
    static logFile = join(Logger.logDir, 'ib-mcp.log');
    static enableLogging = process.env.IB_MCP_DISABLE_LOGGING !== 'true';
    static enableConsoleLogging = process.env.IB_MCP_CONSOLE_LOGGING === 'true' ||
        process.argv.includes('--console-logging') ||
        process.argv.includes('--log-console');
    static ensureLogDir() {
        if (Logger.enableLogging && !existsSync(Logger.logDir)) {
            try {
                mkdirSync(Logger.logDir, { recursive: true });
            }
            catch (error) {
                // If we can't create log dir, disable logging
                Logger.enableLogging = false;
            }
        }
    }
    static writeToFile(level, message, ...args) {
        if (!Logger.enableLogging)
            return;
        try {
            Logger.ensureLogDir();
            const timestamp = new Date().toISOString();
            const argsStr = args.length > 0 ? ' ' + args.map(arg => Logger.serializeArgument(arg)).join(' ') : '';
            const logLine = `${timestamp} [${level}] ${message}${argsStr}\n`;
            appendFileSync(Logger.logFile, logLine, 'utf8');
        }
        catch (error) {
            // Silently fail to avoid recursive logging issues
        }
    }
    static writeToConsole(level, message, ...args) {
        if (!Logger.enableConsoleLogging)
            return;
        const timestamp = new Date().toISOString();
        const argsStr = args.length > 0 ? ' ' + args.map(arg => Logger.serializeArgument(arg)).join(' ') : '';
        const logLine = `${timestamp} [${level}] ${message}${argsStr}`;
        // Use stderr to avoid interfering with MCP JSON-RPC on stdout
        console.error(logLine);
    }
    static writeLog(level, message, ...args) {
        Logger.writeToFile(level, message, ...args);
        Logger.writeToConsole(level, message, ...args);
    }
    static log(message, ...args) {
        Logger.writeLog('LOG', message, ...args);
    }
    static error(message, ...args) {
        Logger.writeLog('ERROR', message, ...args);
    }
    static info(message, ...args) {
        Logger.writeLog('INFO', message, ...args);
    }
    static debug(message, ...args) {
        if (process.env.DEBUG) {
            Logger.writeLog('DEBUG', message, ...args);
        }
    }
    static critical(message, ...args) {
        Logger.writeLog('CRITICAL', message, ...args);
    }
    static warn(message, ...args) {
        Logger.writeLog('WARN', message, ...args);
    }
    // Get the current log file path (useful for debugging)
    static getLogFile() {
        return Logger.enableLogging ? Logger.logFile : null;
    }
    // Log a startup message with log file location
    static logStartup() {
        if (Logger.enableLogging || Logger.enableConsoleLogging) {
            const logDestinations = [];
            if (Logger.enableLogging)
                logDestinations.push(`file: ${Logger.logFile}`);
            if (Logger.enableConsoleLogging)
                logDestinations.push('console');
            Logger.info(`IB MCP Server started - logging to: ${logDestinations.join(', ')}`);
        }
    }
    // Check if console logging is enabled
    static isConsoleLoggingEnabled() {
        return Logger.enableConsoleLogging;
    }
    // Helper method to properly serialize arguments including error objects
    static serializeArgument(arg) {
        if (arg instanceof Error) {
            // For Error objects, extract all important properties including non-enumerable ones
            try {
                return JSON.stringify({
                    ...arg,
                    name: arg.name,
                    message: arg.message,
                    stack: arg.stack,
                });
            }
            catch (circularError) {
                // If even the error object has circular references, return basic info
                return `[Error: ${arg.name}: ${arg.message}]`;
            }
        }
        else if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.stringify(arg, Logger.getCircularReplacer());
            }
            catch (circularError) {
                // Handle other serialization errors
                return '[Object with serialization error]';
            }
        }
        else {
            return String(arg);
        }
    }
    // Helper method to create a replacer function for handling circular references
    static getCircularReplacer() {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular Reference]';
                }
                seen.add(value);
            }
            return value;
        };
    }
}
