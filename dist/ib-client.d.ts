export interface IBClientConfig {
    host: string;
    port: number;
}
export interface StockOrderRequest {
    accountId: string;
    symbol: string;
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: number;
    price?: number;
    stopPrice?: number;
    suppressConfirmations?: boolean;
}
export interface OptionOrderRequest {
    accountId: string;
    symbol: string;
    expiration: string;
    strike: number;
    right: "C" | "P" | "CALL" | "PUT";
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: number;
    price?: number;
    stopPrice?: number;
    suppressConfirmations?: boolean;
    conid?: number;
}
export declare class IBClient {
    private client;
    private baseUrl;
    private config;
    private isAuthenticated;
    private authAttempts;
    private maxAuthAttempts;
    private tickleInterval?;
    private tickleIntervalMs;
    constructor(config: IBClientConfig);
    private initializeClient;
    updatePort(newPort: number): void;
    /**
     * Check authentication status with IB Gateway without triggering automatic authentication
     */
    checkAuthenticationStatus(): Promise<boolean>;
    /**
     * Send a tickle request to maintain the session
     * Rate limit: 1 request per second (we use 30 second intervals to be safe)
     */
    private tickle;
    /**
     * Start automatic session maintenance
     */
    private startTickle;
    /**
     * Stop automatic session maintenance
     */
    private stopTickle;
    /**
     * Cleanup method to stop tickle when client is destroyed
     */
    destroy(): void;
    private authenticate;
    getAccountInfo(): Promise<any>;
    getPositions(accountId?: string): Promise<any>;
    getMarketData(symbol: string, exchange?: string, fields?: string[] | string, conid?: number): Promise<any>;
    getHistoricalData(symbol: string, conid?: number, period?: string, bar?: string, outsideRth?: boolean): Promise<any>;
    getOptionsChain(symbol: string, conid?: number, includeGreeks?: boolean): Promise<any>;
    findOptionContract(symbol: string, expiration?: string, strike?: number | string, right?: string, delta?: number): Promise<any>;
    getPortfolioSummary(accountId?: string, groupBy?: string): Promise<any>;
    private isAuthenticationError;
    placeStockOrder(orderRequest: StockOrderRequest): Promise<any>;
    placeOptionOrder(orderRequest: OptionOrderRequest): Promise<any>;
    /**
     * Confirm an order by replying to confirmation messages
     * @param replyId The reply ID from the confirmation response
     * @param messageIds Array of message IDs to confirm
     * @returns The confirmation response
     */
    confirmOrder(replyId: string, messageIds: string[]): Promise<any>;
    getOrderStatus(orderId: string): Promise<any>;
    getOrders(accountId?: string): Promise<any>;
    /**
     * Cancel an order
     * @param orderId - Order ID to cancel
     * @param accountId - Account ID
     */
    cancelOrder(orderId: string, accountId: string): Promise<any>;
    /**
     * Modify an existing order
     * @param orderId - Order ID to modify
     * @param accountId - Account ID
     * @param modifications - Order modifications (quantity, price, stopPrice)
     */
    modifyOrder(orderId: string, accountId: string, modifications: {
        quantity?: number;
        price?: number;
        stopPrice?: number;
    }): Promise<any>;
    /**
     * Search for contracts by symbol or criteria
     * @param query - Search query (symbol or name)
     * @param secType - Security type (STK, OPT, FUT, CASH, BOND)
     * @param exchange - Optional exchange filter
     * @param currency - Optional currency filter
     * @param limit - Maximum results to return
     */
    searchContracts(query: string, secType?: string, exchange?: string, currency?: string, limit?: number): Promise<any>;
    /**
     * Get detailed contract information
     * @param conid - Contract ID
     */
    getContractDetails(conid: number): Promise<any>;
    /**
     * Get profit and loss information
     * @param accountId - Optional account ID filter
     */
    getPnL(accountId?: string): Promise<any>;
    /**
     * Get trades history
     * @param accountId - Optional account ID filter
     * @param days - Number of days to look back (default: 7)
     */
    getTradesHistory(accountId?: string, days?: number): Promise<any>;
}
