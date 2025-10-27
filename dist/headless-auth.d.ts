import { IBClient } from './ib-client.js';
export interface HeadlessAuthConfig {
    url: string;
    username: string;
    password: string;
    timeout?: number;
    ibClient?: IBClient;
    paperTrading?: boolean;
}
export interface HeadlessAuthResult {
    success: boolean;
    message: string;
    waitingFor2FA?: boolean;
    error?: string;
}
export declare class HeadlessAuthenticator {
    private browser;
    private page;
    authenticate(authConfig: HeadlessAuthConfig): Promise<HeadlessAuthResult>;
    waitForAuthentication(maxWaitTime?: number, ibClient?: IBClient): Promise<HeadlessAuthResult>;
    private cleanup;
    close(): Promise<void>;
}
