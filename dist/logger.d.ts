export declare class Logger {
    private static logDir;
    private static logFile;
    private static enableLogging;
    private static enableConsoleLogging;
    private static ensureLogDir;
    private static writeToFile;
    private static writeToConsole;
    private static writeLog;
    static log(message: string, ...args: any[]): void;
    static error(message: string, ...args: any[]): void;
    static info(message: string, ...args: any[]): void;
    static debug(message: string, ...args: any[]): void;
    static critical(message: string, ...args: any[]): void;
    static warn(message: string, ...args: any[]): void;
    static getLogFile(): string | null;
    static logStartup(): void;
    static isConsoleLoggingEnabled(): boolean;
    private static serializeArgument;
    private static getCircularReplacer;
}
