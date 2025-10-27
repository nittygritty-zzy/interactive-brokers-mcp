export declare class PortUtils {
    static isPortAvailable(port: number): Promise<boolean>;
    static findAvailablePort(startPort?: number, maxAttempts?: number): Promise<number>;
    static isGatewayProcess(port: number): Promise<boolean>;
    static findExistingGateway(): Promise<number | null>;
}
