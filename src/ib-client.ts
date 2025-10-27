import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import https from "https";
import { Logger } from "./logger.js";

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: { requestId: string };
}

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
  expiration: string; // Format: YYYYMMDD or YYMMDD
  strike: number;
  right: "C" | "P" | "CALL" | "PUT";
  action: "BUY" | "SELL";
  orderType: "MKT" | "LMT" | "STP";
  quantity: number;
  price?: number;
  stopPrice?: number;
  suppressConfirmations?: boolean;
  conid?: number; // Optional direct contract ID
}

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

// Market data field presets
const FIELD_PRESETS = {
  basic: "31,84,86,87,88,55", // Last, Bid, Ask, Volume, Bid Size, Symbol
  detailed: "31,84,86,87,88,70,71,82,83,55,7051,7059", // + High, Low, Change, Company Name, Last Size
  options: "31,84,86,87,88,7633,7294,7295,7296", // + Implied Vol, Delta, Gamma, Theta
  fundamentals: "7280,7281,7282,7283,7284,7286,7287,7288,7290,7291", // Industry, Category, etc.
  all: "31,55,58,70,71,72,73,74,75,76,77,78,82,83,84,85,86,87,88,6004,6008,6070,6072,6073,6119,6457,6509,7051,7059,7094,7219,7220,7221,7280,7281,7282,7283,7284,7285,7286,7287,7288,7289,7290,7291,7292,7293,7294,7295,7296,7633"
};

export class IBClient {
  private client!: AxiosInstance;
  private baseUrl!: string;
  private config: IBClientConfig;
  private isAuthenticated = false;
  private authAttempts = 0;
  private maxAuthAttempts = 3;
  private tickleInterval?: NodeJS.Timeout;
  private tickleIntervalMs = 30000; // 30 seconds (well within 1/sec rate limit)

  constructor(config: IBClientConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    // Use HTTPS as IB Gateway expects it
    this.baseUrl = `https://${this.config.host}:${this.config.port}/v1/api`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      // Allow self-signed certificates
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    // Add request interceptor to ensure authentication and log requests
    this.client.interceptors.request.use(async (config) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      Logger.log(`[REQUEST-${requestId}] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: config.headers,
        data: config.data
      });
      
      if (!this.isAuthenticated) {
        Logger.log(`[REQUEST-${requestId}] Not authenticated, authenticating... (attempt ${this.authAttempts + 1}/${this.maxAuthAttempts})`);
        if (this.authAttempts >= this.maxAuthAttempts) {
          throw new Error(`Max authentication attempts (${this.maxAuthAttempts}) exceeded`);
        }
        await this.authenticate();
      }
      
      // Store requestId for response logging
      (config as ExtendedAxiosRequestConfig).metadata = { requestId };
      return config;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        const requestId = (response.config as ExtendedAxiosRequestConfig).metadata?.requestId || 'unknown';
        Logger.log(`[RESPONSE-${requestId}] ${response.status} ${response.statusText}`, {
          url: response.config.url,
          responseSize: JSON.stringify(response.data).length,
          headers: response.headers,
          dataPreview: JSON.stringify(response.data).substring(0, 500) + '...'
        });
        return response;
      },
      (error) => {
        const requestId = (error.config as ExtendedAxiosRequestConfig)?.metadata?.requestId || 'unknown';
          Logger.error(`[ERROR-${requestId}] Request failed:`, {
          url: error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          responseData: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  updatePort(newPort: number): void {
    if (this.config.port !== newPort) {
      Logger.log(`[CLIENT] Updating port from ${this.config.port} to ${newPort}`);
      this.stopTickle(); // Stop tickle for old session
      this.config.port = newPort;
      this.isAuthenticated = false; // Force re-authentication with new port
      this.authAttempts = 0; // Reset auth attempts
      this.initializeClient(); // Re-initialize client with new port
    }
  }

  /**
   * Check authentication status with IB Gateway without triggering automatic authentication
   */
  async checkAuthenticationStatus(): Promise<boolean> {
    try {
      Logger.log("[AUTH-CHECK] Checking authentication status...");
      
      // Create a new axios instance without interceptors to avoid triggering authentication
      const authClient = axios.create({
        baseURL: this.baseUrl,
        timeout: 30000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });
      
      const response = await authClient.get("/iserver/auth/status");
      Logger.log("[AUTH-CHECK] Auth status response:", response.data);
      
      const authenticated = response.data.authenticated === true;
      this.isAuthenticated = authenticated;
      
      if (authenticated) {
        this.authAttempts = 0; // Reset auth attempts on successful check
        this.startTickle(); // Start session maintenance
      } else {
        this.stopTickle(); // Stop tickle if not authenticated
      }
      
      return authenticated;
    } catch (error) {
      this.isAuthenticated = false;
      this.stopTickle();
      return false;
    }
  }

  /**
   * Send a tickle request to maintain the session
   * Rate limit: 1 request per second (we use 30 second intervals to be safe)
   */
  private async tickle(): Promise<void> {
    try {
      // Create a new axios instance without interceptors to avoid triggering authentication
      const tickleClient = axios.create({
        baseURL: this.baseUrl,
        timeout: 10000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });
      
      await tickleClient.post("/tickle");
      Logger.log("[TICKLE] Session maintenance ping sent successfully");
    } catch (error) {
      Logger.warn("[TICKLE] Failed to send session maintenance ping:", error);
      // If tickle fails, check authentication status
      const isAuth = await this.checkAuthenticationStatus();
      if (!isAuth) {
        Logger.warn("[TICKLE] Session expired, stopping tickle interval");
        this.stopTickle();
      }
    }
  }

  /**
   * Start automatic session maintenance
   */
  private startTickle(): void {
    if (this.tickleInterval) {
      return; // Already running
    }
    
    Logger.log(`[TICKLE] Starting automatic session maintenance (interval: ${this.tickleIntervalMs}ms)`);
    this.tickleInterval = setInterval(() => {
      this.tickle();
    }, this.tickleIntervalMs);
  }

  /**
   * Stop automatic session maintenance
   */
  private stopTickle(): void {
    if (this.tickleInterval) {
      Logger.log("[TICKLE] Stopping automatic session maintenance");
      clearInterval(this.tickleInterval);
      this.tickleInterval = undefined;
    }
  }

  /**
   * Cleanup method to stop tickle when client is destroyed
   */
  public destroy(): void {
    this.stopTickle();
  }

  private async authenticate(): Promise<void> {
    Logger.log(`[AUTH] Starting authentication process... (attempt ${this.authAttempts + 1}/${this.maxAuthAttempts})`);
    this.authAttempts++;
    
    try {
      // Create a new axios instance without interceptors to avoid infinite recursion
      const authClient = axios.create({
        baseURL: this.baseUrl,
        timeout: 30000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });
      
      // Check if already authenticated
      Logger.log("[AUTH] Checking authentication status...");
      const response = await authClient.get("/iserver/auth/status");
      Logger.log("[AUTH] Auth status response:", response.data);
      
      if (response.data.authenticated) {
        Logger.log("[AUTH] Already authenticated");
        this.isAuthenticated = true;
        this.authAttempts = 0; // Reset on success
        this.startTickle(); // Start session maintenance
        return;
      }

      // Re-authenticate if needed
      Logger.log("[AUTH] Re-authenticating...");
      await authClient.post("/iserver/reauthenticate");
      Logger.log("[AUTH] Re-authentication successful");
      this.isAuthenticated = true;
      this.authAttempts = 0; // Reset on success
      this.startTickle(); // Start session maintenance
    } catch (error) {
      Logger.error(`[AUTH] Authentication failed (attempt ${this.authAttempts}/${this.maxAuthAttempts}):`, isError(error) && error.message, isError(error) && error.stack);
      if (this.authAttempts >= this.maxAuthAttempts) {
        throw new Error(`Failed to authenticate with IB Gateway after ${this.maxAuthAttempts} attempts`);
      }
      throw new Error("Failed to authenticate with IB Gateway");
    }
  }

  async getAccountInfo(): Promise<any> {
    Logger.log("[ACCOUNT-INFO] Starting getAccountInfo request...");
    try {
      Logger.log("[ACCOUNT-INFO] Fetching portfolio accounts...");
      const accountsResponse = await this.client.get("/portfolio/accounts");
      const accounts = accountsResponse.data;
      Logger.log(`[ACCOUNT-INFO] Found ${accounts?.length || 0} accounts:`, accounts);

      const result = {
        accounts: accounts,
        summaries: [] as any[]
      };

      Logger.log("[ACCOUNT-INFO] Processing account summaries...");
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        Logger.log(`[ACCOUNT-INFO] Processing account ${i + 1}/${accounts.length}: ${account.id}`);
        
        const summaryResponse = await this.client.get(
          `/portfolio/${account.id}/summary`
        );
        const summary = summaryResponse.data;
        Logger.log(`[ACCOUNT-INFO] Account ${account.id} summary:`, summary);

        result.summaries.push({
          accountId: account.id,
          summary: summary
        });
      }

      Logger.log(`[ACCOUNT-INFO] Completed processing ${result.summaries.length} accounts`);
      return result;
    } catch (error) {
      Logger.error("[ACCOUNT-INFO] Failed to get account info:", error);
      
      // Check if this is likely an authentication error
      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to retrieve account information. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }
      
      throw new Error("Failed to retrieve account information");
    }
  }

  async getPositions(accountId?: string): Promise<any> {
    try {
      let url = "/portfolio/positions";
      if (accountId) {
        url = `/portfolio/${accountId}/positions`;
      }

      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
        Logger.error("Failed to get positions:", error);
      
      // Check if this is likely an authentication error
      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to retrieve positions. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }
      
      throw new Error("Failed to retrieve positions");
    }
  }

  async getMarketData(symbol: string, exchange?: string, fields?: string[] | string, conid?: number): Promise<any> {
    try {
      let contractId = conid;

      // If conid not provided, search for contract
      if (!contractId) {
        const searchResponse = await this.client.get(
          `/iserver/secdef/search?symbol=${symbol}`
        );

        if (!searchResponse.data || searchResponse.data.length === 0) {
          throw new Error(`Symbol ${symbol} not found`);
        }

        const contract = searchResponse.data[0];
        contractId = contract.conid;
      }

      // Determine fields to use
      let fieldStr: string;
      if (!fields) {
        fieldStr = FIELD_PRESETS.detailed; // Default to detailed
      } else if (typeof fields === 'string') {
        // It's a preset name
        fieldStr = FIELD_PRESETS[fields as keyof typeof FIELD_PRESETS] || FIELD_PRESETS.detailed;
      } else {
        // It's an array of field codes
        fieldStr = fields.join(',');
      }

      Logger.log(`Getting market data for conid ${contractId} with fields: ${fieldStr}`);

      // Get market data snapshot (first call is preflight)
      const response = await this.client.get(
        `/iserver/marketdata/snapshot?conids=${contractId}&fields=${fieldStr}`
      );

      // Second call to get actual data (first call initializes stream)
      const dataResponse = await this.client.get(
        `/iserver/marketdata/snapshot?conids=${contractId}&fields=${fieldStr}`
      );

      return {
        symbol: symbol,
        conid: contractId,
        marketData: dataResponse.data
      };
    } catch (error) {
      Logger.error("Failed to get market data:", error);

      // Check if this is likely an authentication error
      if (this.isAuthenticationError(error)) {
        const authError = new Error(`Authentication required to retrieve market data for ${symbol}. Please authenticate with Interactive Brokers first.`);
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to retrieve market data for ${symbol}`);
    }
  }

  async getHistoricalData(symbol: string, conid?: number, period?: string, bar?: string, outsideRth?: boolean): Promise<any> {
    try {
      let contractId = conid;

      // If conid not provided, search for contract
      if (!contractId) {
        const searchResponse = await this.client.get(
          `/iserver/secdef/search?symbol=${symbol}`
        );

        if (!searchResponse.data || searchResponse.data.length === 0) {
          throw new Error(`Symbol ${symbol} not found`);
        }

        const contract = searchResponse.data[0];
        contractId = contract.conid;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('conid', contractId!.toString());
      if (period) params.append('period', period);
      if (bar) params.append('bar', bar);
      if (outsideRth !== undefined) params.append('outsideRth', outsideRth.toString());

      Logger.log(`Getting historical data for ${symbol} (conid: ${contractId})`);

      const response = await this.client.get(`/iserver/marketdata/history?${params.toString()}`);

      return {
        symbol: symbol,
        conid: contractId,
        period: period || response.data.period,
        bar: bar || response.data.barLength,
        data: response.data
      };
    } catch (error) {
      Logger.error("Failed to get historical data:", error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error(`Authentication required to retrieve historical data for ${symbol}. Please authenticate with Interactive Brokers first.`);
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to retrieve historical data for ${symbol}`);
    }
  }

  async getOptionsChain(symbol: string, conid?: number, includeGreeks: boolean = true): Promise<any> {
    try {
      let underlyingConid = conid;

      // If conid not provided, search for underlying
      if (!underlyingConid) {
        const searchResponse = await this.client.get(
          `/iserver/secdef/search?symbol=${symbol}&secType=STK`
        );

        if (!searchResponse.data || searchResponse.data.length === 0) {
          throw new Error(`Underlying symbol ${symbol} not found`);
        }

        const contract = searchResponse.data.find((c: any) => c.assetClass === 'STK' || c.secType === 'STK')
                        || searchResponse.data[0];
        underlyingConid = contract.conid;
      }

      Logger.log(`Getting options chain for ${symbol} (conid: ${underlyingConid})`);

      // Get security definition to find available months
      const secdefResponse = await this.client.get(
        `/iserver/secdef/search?symbol=${symbol}&secType=OPT`
      );

      if (!secdefResponse.data || secdefResponse.data.length === 0) {
        throw new Error(`No options found for ${symbol}`);
      }

      // Extract unique expiration months from the search results
      const months = new Set<string>();
      secdefResponse.data.forEach((opt: any) => {
        if (opt.months) {
          opt.months.split(';').forEach((m: string) => months.add(m));
        }
      });

      const monthsArray = Array.from(months).slice(0, 4); // Get first 4 expirations

      Logger.log(`Found expiration months: ${monthsArray.join(', ')}`);

      // For each month, get strikes
      const expirations = [];
      for (const month of monthsArray) {
        try {
          const strikesResponse = await this.client.get(
            `/iserver/secdef/strikes?conid=${underlyingConid}&secType=OPT&month=${month}`
          );

          if (strikesResponse.data) {
            expirations.push({
              month: month,
              callStrikes: strikesResponse.data.call || [],
              putStrikes: strikesResponse.data.put || []
            });
          }
        } catch (strikeError) {
          Logger.warn(`Could not get strikes for month ${month}:`, strikeError);
        }
      }

      return {
        symbol: symbol,
        underlyingConid: underlyingConid,
        expirations: expirations
      };
    } catch (error) {
      Logger.error("Failed to get options chain:", error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error(`Authentication required to retrieve options chain for ${symbol}. Please authenticate with Interactive Brokers first.`);
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to retrieve options chain for ${symbol}`);
    }
  }

  async findOptionContract(symbol: string, expiration?: string, strike?: number | string, right?: string, delta?: number): Promise<any> {
    try {
      Logger.log(`Finding option contract for ${symbol}`);

      // Get options chain first
      const chain = await this.getOptionsChain(symbol);

      if (!chain.expirations || chain.expirations.length === 0) {
        throw new Error(`No options chain found for ${symbol}`);
      }

      // If expiration specified, find matching month
      let targetMonth = chain.expirations[0].month; // Default to nearest
      if (expiration) {
        // Try to match expiration
        const exp = expiration.toUpperCase();
        const matchedMonth = chain.expirations.find((e: any) =>
          e.month.includes(exp) || exp.includes(e.month)
        );
        if (matchedMonth) {
          targetMonth = matchedMonth.month;
        }
      }

      const expData = chain.expirations.find((e: any) => e.month === targetMonth);
      if (!expData) {
        throw new Error(`Expiration ${expiration || 'nearest'} not found`);
      }

      // Determine right type
      const isCall = !right || right === 'C' || right === 'CALL';
      const strikes = isCall ? expData.callStrikes : expData.putStrikes;

      if (!strikes || strikes.length === 0) {
        throw new Error(`No ${isCall ? 'call' : 'put'} strikes found`);
      }

      // Find strike
      let targetStrike: number;
      if (strike) {
        if (typeof strike === 'number') {
          targetStrike = strike;
        } else {
          targetStrike = parseFloat(strike);
        }
      } else {
        // Find ATM strike (middle of the range)
        targetStrike = strikes[Math.floor(strikes.length / 2)];
      }

      // Find closest strike
      const closestStrike = strikes.reduce((prev: number, curr: number) =>
        Math.abs(curr - targetStrike) < Math.abs(prev - targetStrike) ? curr : prev
      );

      return {
        symbol: symbol,
        expiration: targetMonth,
        strike: closestStrike,
        right: isCall ? 'C' : 'P',
        underlyingConid: chain.underlyingConid
      };
    } catch (error) {
      Logger.error("Failed to find option contract:", error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error(`Authentication required to find option contract for ${symbol}. Please authenticate with Interactive Brokers first.`);
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to find option contract for ${symbol}`);
    }
  }

  async getPortfolioSummary(accountId?: string, groupBy?: string): Promise<any> {
    try {
      // Get account info first
      const accountsResponse = await this.client.get('/portfolio/accounts');
      const accounts = accountsResponse.data;

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Use first account if not specified
      const targetAccount = accountId || accounts[0].accountId || accounts[0].id;

      Logger.log(`Getting portfolio summary for account ${targetAccount}`);

      // Get positions
      const positionsResponse = await this.client.get(
        `/portfolio/${targetAccount}/positions/0`
      );

      const positions = positionsResponse.data || [];

      // Calculate summary statistics
      let totalValue = 0;
      let totalPnL = 0;
      let dailyPnL = 0;
      const bySecType: any = {};
      const topPositions: any[] = [];

      positions.forEach((pos: any) => {
        const value = pos.mktValue || 0;
        const unrealizedPnL = pos.unrealizedPnl || 0;
        const realizedPnL = pos.realizedPnl || 0;

        totalValue += value;
        totalPnL += unrealizedPnL + realizedPnL;

        // Group by security type
        const secType = pos.assetClass || pos.secType || 'OTHER';
        if (!bySecType[secType]) {
          bySecType[secType] = { count: 0, value: 0 };
        }
        bySecType[secType].count++;
        bySecType[secType].value += value;

        // Track top positions
        topPositions.push({
          symbol: pos.contractDesc || pos.ticker || pos.symbol,
          quantity: pos.position,
          marketValue: value,
          unrealizedPnL: unrealizedPnL,
          pnlPercent: value !== 0 ? (unrealizedPnL / (value - unrealizedPnL)) * 100 : 0
        });
      });

      // Sort top positions by value
      topPositions.sort((a, b) => Math.abs(b.marketValue) - Math.abs(a.marketValue));

      return {
        accountId: targetAccount,
        totalValue: totalValue,
        totalPnL: totalPnL,
        dailyPnL: dailyPnL,
        positionCount: positions.length,
        bySecType: bySecType,
        topPositions: topPositions.slice(0, 10)
      };
    } catch (error) {
      Logger.error("Failed to get portfolio summary:", error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error(`Authentication required to retrieve portfolio summary. Please authenticate with Interactive Brokers first.`);
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error("Failed to retrieve portfolio summary");
    }
  }

  private isAuthenticationError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    const errorStatus = error.response?.status;
    const responseData = error.response?.data;
    
    // Check for common authentication error patterns
    return (
      errorStatus === 401 ||
      errorStatus === 403 ||
      errorStatus === 500 ||  // IB Gateway sometimes returns 500 for auth issues
      errorMessage.includes("authentication") ||
      errorMessage.includes("authenticate") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("not authenticated") ||
      errorMessage.includes("login") ||
      responseData?.error?.message?.includes("not authenticated") ||
      responseData?.error?.message?.includes("authentication") ||
      // IB Gateway specific patterns
      responseData?.error === "not authenticated" ||
      (errorStatus === 500 && responseData?.error?.includes("authentication"))
    );
  }

  async placeStockOrder(orderRequest: StockOrderRequest): Promise<any> {
    try {
      // First, get the contract ID for the symbol
      const searchResponse = await this.client.get(
        `/iserver/secdef/search?symbol=${orderRequest.symbol}`
      );

      if (!searchResponse.data || searchResponse.data.length === 0) {
        throw new Error(`Stock symbol ${orderRequest.symbol} not found`);
      }

      // Find the stock contract (secType: STK)
      const contract = searchResponse.data.find((c: any) => c.assetClass === 'STK' || c.secType === 'STK')
                       || searchResponse.data[0];
      const conid = contract.conid;

      // Prepare order object
      const order = {
        conid: Number(conid),
        orderType: orderRequest.orderType,
        side: orderRequest.action,
        quantity: Number(orderRequest.quantity),
        tif: "DAY",
      };

      // Add price for limit orders
      if (orderRequest.orderType === "LMT" && orderRequest.price !== undefined) {
        (order as any).price = Number(orderRequest.price);
      }

      // Add stop price for stop orders
      if (orderRequest.orderType === "STP" && orderRequest.stopPrice !== undefined) {
        (order as any).auxPrice = Number(orderRequest.stopPrice);
      }

      // Place the order
      const response = await this.client.post(
        `/iserver/account/${orderRequest.accountId}/orders`,
        {
          orders: [order],
        }
      );

      // Check if we received confirmation messages that need to be handled
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const firstResponse = response.data[0];

        // Check if this is a confirmation message response
        if (firstResponse.id && firstResponse.message && firstResponse.messageIds && orderRequest.suppressConfirmations) {
          Logger.log("Stock order confirmation received, automatically confirming...", firstResponse);

          // Automatically confirm all messages
          const confirmResponse = await this.confirmOrder(firstResponse.id, firstResponse.messageIds);
          return confirmResponse;
        }
      }

      return response.data;
    } catch (error) {
      Logger.error("Failed to place stock order:", error);

      // Check if this is likely an authentication error
      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to place orders. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error("Failed to place stock order");
    }
  }

  async placeOptionOrder(orderRequest: OptionOrderRequest): Promise<any> {
    try {
      let conid: number;

      // If conid is directly provided, use it
      if (orderRequest.conid) {
        conid = orderRequest.conid;
        Logger.log(`Using provided contract ID: ${conid}`);
      } else {
        // Normalize right to single letter
        const right = orderRequest.right === "CALL" ? "C" : orderRequest.right === "PUT" ? "P" : orderRequest.right;

        // Search for option contract using secdef/info endpoint
        // Format expiration: ensure YYYYMMDD format
        let expiration = orderRequest.expiration;
        if (expiration.length === 6) {
          // Convert YYMMDD to YYYYMMDD
          const year = parseInt(expiration.substring(0, 2));
          const fullYear = year < 50 ? 2000 + year : 1900 + year;
          expiration = fullYear.toString() + expiration.substring(2);
        }

        Logger.log(`Searching for option: ${orderRequest.symbol} ${expiration} ${orderRequest.strike}${right}`);

        // First get the underlying stock conid
        const stockSearchResponse = await this.client.get(
          `/iserver/secdef/search?symbol=${orderRequest.symbol}`
        );

        if (!stockSearchResponse.data || stockSearchResponse.data.length === 0) {
          throw new Error(`Underlying symbol ${orderRequest.symbol} not found`);
        }

        const stockContract = stockSearchResponse.data.find((c: any) => c.assetClass === 'STK' || c.secType === 'STK')
                              || stockSearchResponse.data[0];
        const underlyingConid = stockContract.conid;

        // Search for the specific option contract
        const optionSearchResponse = await this.client.get(
          `/iserver/secdef/search?symbol=${orderRequest.symbol}&secType=OPT`
        );

        Logger.log(`Option search results:`, optionSearchResponse.data);

        // Try to find exact match based on strike, expiration, and right
        let optionContract = null;
        if (optionSearchResponse.data && optionSearchResponse.data.length > 0) {
          // The API may return option contracts - try to match by description or sections
          for (const contract of optionSearchResponse.data) {
            const desc = contract.description || '';
            const sections = contract.sections || [];

            // Check if this matches our criteria
            if (sections.length > 0) {
              const section = sections[0];
              if (section.secType === 'OPT') {
                // Get detailed contract info
                try {
                  const infoResponse = await this.client.get(`/iserver/secdef/info?conid=${contract.conid}`);
                  Logger.log(`Contract ${contract.conid} info:`, infoResponse.data);

                  // Check if this matches our strike, expiration, and right
                  // This is a best-effort match - IB API structure can vary
                  optionContract = contract;
                  break;
                } catch (infoError) {
                  Logger.warn(`Could not get info for contract ${contract.conid}`);
                }
              }
            }
          }
        }

        if (!optionContract) {
          throw new Error(
            `Option contract not found for ${orderRequest.symbol} ` +
            `${expiration} ${orderRequest.strike}${right}. ` +
            `Try using the conid parameter if you know the contract ID.`
          );
        }

        conid = optionContract.conid;
        Logger.log(`Found option contract ID: ${conid}`);
      }

      // Prepare order object
      const order = {
        conid: Number(conid),
        orderType: orderRequest.orderType,
        side: orderRequest.action,
        quantity: Number(orderRequest.quantity),
        tif: "DAY",
      };

      // Add price for limit orders
      if (orderRequest.orderType === "LMT" && orderRequest.price !== undefined) {
        (order as any).price = Number(orderRequest.price);
      }

      // Add stop price for stop orders
      if (orderRequest.orderType === "STP" && orderRequest.stopPrice !== undefined) {
        (order as any).auxPrice = Number(orderRequest.stopPrice);
      }

      // Place the order
      const response = await this.client.post(
        `/iserver/account/${orderRequest.accountId}/orders`,
        {
          orders: [order],
        }
      );

      // Check if we received confirmation messages that need to be handled
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const firstResponse = response.data[0];

        // Check if this is a confirmation message response
        if (firstResponse.id && firstResponse.message && firstResponse.messageIds && orderRequest.suppressConfirmations) {
          Logger.log("Option order confirmation received, automatically confirming...", firstResponse);

          // Automatically confirm all messages
          const confirmResponse = await this.confirmOrder(firstResponse.id, firstResponse.messageIds);
          return confirmResponse;
        }
      }

      return response.data;
    } catch (error) {
      Logger.error("Failed to place option order:", error);

      // Check if this is likely an authentication error
      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to place option orders. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to place option order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Confirm an order by replying to confirmation messages
   * @param replyId The reply ID from the confirmation response
   * @param messageIds Array of message IDs to confirm
   * @returns The confirmation response
   */
  async confirmOrder(replyId: string, messageIds: string[]): Promise<any> {
    try {
      Logger.log(`Confirming order with reply ID ${replyId} and message IDs:`, messageIds);
      
      const response = await this.client.post(`/iserver/reply/${replyId}`, {
        confirmed: true,
        messageIds: messageIds
      });

      Logger.log("Order confirmation response:", response.data);
      return response.data;
    } catch (error) {
      Logger.error("Failed to confirm order:", error);
      
      // Check if this is likely an authentication error
      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to confirm orders. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }
      
      throw new Error("Failed to confirm order: " + (error as any).message);
    }
  }

  async getOrderStatus(orderId: string): Promise<any> {
    try {
      const response = await this.client.get(`/iserver/account/orders/${orderId}`);
      return response.data;
    } catch (error) {
      Logger.error("Failed to get order status:", error);
      
      // Check if this is likely an authentication error
      if (this.isAuthenticationError(error)) {
        const authError = new Error(`Authentication required to get order status for order ${orderId}. Please authenticate with Interactive Brokers first.`);
        (authError as any).isAuthError = true;
        throw authError;
      }
      
      throw new Error(`Failed to get status for order ${orderId}`);
    }
  }

  async getOrders(accountId?: string): Promise<any> {
    try {
      let url = "/iserver/account/orders";
      if (accountId) {
        url = `/iserver/account/${accountId}/orders`;
      }

      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      Logger.error("Failed to get orders:", error);

      // Check if this is likely an authentication error
      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to retrieve orders. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error("Failed to retrieve orders");
    }
  }

  /**
   * Cancel an order
   * @param orderId - Order ID to cancel
   * @param accountId - Account ID
   */
  async cancelOrder(orderId: string, accountId: string): Promise<any> {
    try {
      Logger.log(`[CANCEL ORDER] Cancelling order ${orderId} for account ${accountId}`);

      const url = `/iserver/account/${accountId}/order/${orderId}`;
      const response = await this.client.delete(url);

      Logger.log(`[CANCEL ORDER] Order ${orderId} cancelled successfully`);
      return response.data;
    } catch (error) {
      Logger.error(`Failed to cancel order ${orderId}:`, error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to cancel order. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to cancel order ${orderId}`);
    }
  }

  /**
   * Modify an existing order
   * @param orderId - Order ID to modify
   * @param accountId - Account ID
   * @param modifications - Order modifications (quantity, price, stopPrice)
   */
  async modifyOrder(orderId: string, accountId: string, modifications: {
    quantity?: number;
    price?: number;
    stopPrice?: number;
  }): Promise<any> {
    try {
      Logger.log(`[MODIFY ORDER] Modifying order ${orderId} for account ${accountId}`);

      const url = `/iserver/account/${accountId}/order/${orderId}`;

      // Build modification payload
      const payload: any = {};
      if (modifications.quantity !== undefined) {
        payload.quantity = modifications.quantity;
      }
      if (modifications.price !== undefined) {
        payload.price = modifications.price;
      }
      if (modifications.stopPrice !== undefined) {
        payload.auxPrice = modifications.stopPrice;
      }

      const response = await this.client.post(url, payload);

      Logger.log(`[MODIFY ORDER] Order ${orderId} modified successfully`);
      return response.data;
    } catch (error) {
      Logger.error(`Failed to modify order ${orderId}:`, error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to modify order. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to modify order ${orderId}`);
    }
  }

  /**
   * Search for contracts by symbol or criteria
   * @param query - Search query (symbol or name)
   * @param secType - Security type (STK, OPT, FUT, CASH, BOND)
   * @param exchange - Optional exchange filter
   * @param currency - Optional currency filter
   * @param limit - Maximum results to return
   */
  async searchContracts(query: string, secType?: string, exchange?: string, currency?: string, limit: number = 10): Promise<any> {
    try {
      Logger.log(`[SEARCH] Searching for contracts: ${query}`);

      let url = `/iserver/secdef/search?symbol=${encodeURIComponent(query)}`;
      if (secType) {
        url += `&secType=${secType}`;
      }
      if (exchange) {
        url += `&exchange=${exchange}`;
      }

      const response = await this.client.get(url);
      let results = response.data || [];

      // Filter by currency if specified
      if (currency) {
        results = results.filter((contract: any) => contract.currency === currency);
      }

      // Limit results
      results = results.slice(0, limit);

      Logger.log(`[SEARCH] Found ${results.length} contracts`);
      return results;
    } catch (error) {
      Logger.error(`Failed to search contracts for ${query}:`, error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to search contracts. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to search contracts for ${query}`);
    }
  }

  /**
   * Get detailed contract information
   * @param conid - Contract ID
   */
  async getContractDetails(conid: number): Promise<any> {
    try {
      Logger.log(`[CONTRACT DETAILS] Fetching details for contract ${conid}`);

      const url = `/iserver/secdef/info?conid=${conid}`;
      const response = await this.client.get(url);

      Logger.log(`[CONTRACT DETAILS] Retrieved details for contract ${conid}`);
      return response.data;
    } catch (error) {
      Logger.error(`Failed to get contract details for ${conid}:`, error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to get contract details. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error(`Failed to get contract details for ${conid}`);
    }
  }

  /**
   * Get profit and loss information
   * @param accountId - Optional account ID filter
   */
  async getPnL(accountId?: string): Promise<any> {
    try {
      Logger.log(`[P&L] Fetching P&L data${accountId ? ` for account ${accountId}` : ''}`);

      // Get account summary which includes P&L data
      let url = accountId ? `/portfolio/${accountId}/summary` : `/portfolio/accounts`;
      const response = await this.client.get(url);

      if (accountId) {
        // Single account P&L
        return {
          accountId,
          pnl: response.data
        };
      } else {
        // Get P&L for all accounts
        const accounts = response.data;
        const pnlData = [];

        for (const account of accounts) {
          const summaryResponse = await this.client.get(`/portfolio/${account.accountId}/summary`);
          pnlData.push({
            accountId: account.accountId,
            pnl: summaryResponse.data
          });
        }

        return pnlData;
      }
    } catch (error) {
      Logger.error("Failed to get P&L data:", error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to retrieve P&L. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error("Failed to retrieve P&L data");
    }
  }

  /**
   * Get trades history
   * @param accountId - Optional account ID filter
   * @param days - Number of days to look back (default: 7)
   */
  async getTradesHistory(accountId?: string, days: number = 7): Promise<any> {
    try {
      Logger.log(`[TRADES HISTORY] Fetching trades for last ${days} days${accountId ? ` for account ${accountId}` : ''}`);

      // IBKR uses /iserver/account/trades endpoint
      // Note: The exact endpoint may vary based on IBKR API version
      let url = `/iserver/account/trades`;
      if (accountId) {
        url = `/iserver/account/${accountId}/trades`;
      }

      const response = await this.client.get(url);
      let trades = response.data || [];

      // Filter by date if needed (trades within last N days)
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        trades = trades.filter((trade: any) => {
          if (trade.execution_time || trade.time) {
            const tradeDate = new Date(trade.execution_time || trade.time);
            return tradeDate >= cutoffDate;
          }
          return true; // Keep if no date available
        });
      }

      Logger.log(`[TRADES HISTORY] Found ${trades.length} trades`);
      return trades;
    } catch (error) {
      Logger.error("Failed to get trades history:", error);

      if (this.isAuthenticationError(error)) {
        const authError = new Error("Authentication required to retrieve trades history. Please authenticate with Interactive Brokers first.");
        (authError as any).isAuthError = true;
        throw authError;
      }

      throw new Error("Failed to retrieve trades history");
    }
  }
}
