export declare class ConfigUtils {
    static createTempConfigWithPort(gatewayDir: string, port: number): Promise<void>;
    static cleanupTempConfigFiles(gatewayDir: string): Promise<void>;
}
