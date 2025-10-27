import { IBClient } from "./ib-client.js";
import { IBGatewayManager } from "./gateway-manager.js";
import { HeadlessAuthenticator, HeadlessAuthConfig } from "./headless-auth.js";
import open from "open";
import { Logger } from "./logger.js";
import {
  AuthenticateInput,
  GetAccountInfoInput,
  GetPositionsInput,
  GetMarketDataInput,
  GetHistoricalDataInput,
  GetQuoteInput,
  GetOptionsChainInput,
  FindOptionContractInput,
  GetPortfolioSummaryInput,
  PlaceStockOrderInput,
  PlaceOptionOrderInput,
  GetOrderStatusInput,
  GetLiveOrdersInput,
  ConfirmOrderInput,
  CancelOrderInput,
  ModifyOrderInput,
  SearchContractsInput,
  GetContractDetailsInput,
  GetPnLInput,
  GetTradesHistoryInput,
} from "./tool-definitions.js";

export interface ToolHandlerContext {
  ibClient: IBClient;
  gatewayManager?: IBGatewayManager;
  config: any;
}

export type ToolHandlerResult = {
  content: Array<{
    type: "text";
    text: string;
  }>;
};

export class ToolHandlers {
  private context: ToolHandlerContext;

  constructor(context: ToolHandlerContext) {
    this.context = context;
  }

  // Ensure Gateway is ready before operations
  private async ensureGatewayReady(): Promise<void> {
    if (this.context.gatewayManager) {
      await this.context.gatewayManager.ensureGatewayReady();
    }
  }

  // Authentication management
  private async ensureAuth(): Promise<void> {
    // Ensure Gateway is ready first
    await this.ensureGatewayReady();
    
    // Check if already authenticated
    const isAuthenticated = await this.context.ibClient.checkAuthenticationStatus();
    if (isAuthenticated) {
      return; // Already authenticated
    }

    // If in headless mode, start automatic headless authentication
    if (this.context.config.IB_HEADLESS_MODE) {
      const port = this.context.gatewayManager 
        ? this.context.gatewayManager.getCurrentPort() 
        : this.context.config.IB_GATEWAY_PORT;
      const authUrl = `https://${this.context.config.IB_GATEWAY_HOST}:${port}`;
      
      // Validate that we have credentials for headless mode
      if (!this.context.config.IB_USERNAME || !this.context.config.IB_PASSWORD_AUTH) {
        throw new Error("Headless mode enabled but authentication credentials missing. Please set IB_USERNAME and IB_PASSWORD_AUTH environment variables.");
      }

      const authConfig: HeadlessAuthConfig = {
        url: authUrl,
        username: this.context.config.IB_USERNAME,
        password: this.context.config.IB_PASSWORD_AUTH,
        timeout: this.context.config.IB_AUTH_TIMEOUT,
        ibClient: this.context.ibClient, // Pass the IB client for authentication checking
        paperTrading: this.context.config.IB_PAPER_TRADING,
      };

      const authenticator = new HeadlessAuthenticator();
      const result = await authenticator.authenticate(authConfig);

      if (!result.success) {
        throw new Error(`Authentication failed: ${result.message}`);
      }
    } else {
      // In non-headless mode, throw an error asking user to authenticate manually
      const port = this.context.gatewayManager 
        ? this.context.gatewayManager.getCurrentPort() 
        : this.context.config.IB_GATEWAY_PORT;
      const authUrl = `https://${this.context.config.IB_GATEWAY_HOST}:${port}`;
      throw new Error(`Authentication required. Please use the 'authenticate' tool to complete the authentication process at ${authUrl}.`);
    }
  }

  // Helper function to check for authentication errors
  private isAuthenticationError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    const errorStatus = error.response?.status;
    const responseData = error.response?.data;
    
    return (
      errorStatus === 401 ||
      errorStatus === 403 ||
      errorStatus === 500 ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("not authenticated") ||
      errorMessage.includes("login") ||
      responseData?.error === "not authenticated"
    );
  }

  private getAuthenticationErrorMessage(): string {
    const port = this.context.gatewayManager 
      ? this.context.gatewayManager.getCurrentPort() 
      : this.context.config.IB_GATEWAY_PORT;
    const authUrl = `https://${this.context.config.IB_GATEWAY_HOST}:${port}`;
    const mode = this.context.config.IB_HEADLESS_MODE ? "headless mode" : "browser mode";
    return `Authentication required. Please use the 'authenticate' tool to complete the authentication process (configured for ${mode}) at ${authUrl}.`;
  }

  private formatError(error: unknown): string {
    if (this.isAuthenticationError(error)) {
      return this.getAuthenticationErrorMessage();
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: ${errorMessage}`;
  }

  async authenticate(input: AuthenticateInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();
      
      const port = this.context.gatewayManager 
        ? this.context.gatewayManager.getCurrentPort() 
        : this.context.config.IB_GATEWAY_PORT;
      const authUrl = `https://${this.context.config.IB_GATEWAY_HOST}:${port}`;
      
      // Check if headless mode is enabled in config
      if (this.context.config.IB_HEADLESS_MODE) {
        try {
          // Use headless authentication
          const authConfig: HeadlessAuthConfig = {
            url: authUrl,
            username: this.context.config.IB_USERNAME,
            password: this.context.config.IB_PASSWORD_AUTH,
            timeout: this.context.config.IB_AUTH_TIMEOUT,
          };

          // Validate that we have credentials for headless mode
          if (!authConfig.username || !authConfig.password) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    message: "Headless mode enabled but authentication credentials missing",
                    error: "Please set IB_USERNAME and IB_PASSWORD_AUTH environment variables for headless authentication",
                    authUrl: authUrl,
                    instructions: [
                      "Set environment variables: IB_USERNAME and IB_PASSWORD_AUTH",
                      "Or disable headless mode by setting IB_HEADLESS_MODE=false",
                      "Then try authentication again"
                    ]
                  }, null, 2),
                },
              ],
            };
          }

          const authenticator = new HeadlessAuthenticator();
          const result = await authenticator.authenticate(authConfig);

          // Authentication completed (success or failure) - no separate 2FA handling needed
          await authenticator.close();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  ...result,
                  authUrl: authUrl,
                  mode: "headless",
                  note: "Headless authentication completed automatically"
                }, null, 2),
              },
            ],
          };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  message: "Headless authentication failed, falling back to manual browser authentication",
                  error: errorMessage,
                  authUrl: authUrl,
                  mode: "fallback_to_manual",
                  note: "Opening browser for manual authentication..."
                }, null, 2),
              },
            ],
          };
        }
      }
      
      // Original browser-based authentication (when headless mode is disabled or as fallback)
      try {
        await open(authUrl);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "Interactive Brokers authentication interface opened in your browser",
                authUrl: authUrl,
                mode: "browser",
                instructions: [
                  "1. The authentication page has been opened in your default browser",
                  "2. Accept any SSL certificate warnings (this is normal for localhost)",
                  "3. Complete the authentication process in the IB Gateway web interface",
                  "4. Log in with your Interactive Brokers credentials",
                  "5. Once authenticated, you can use other trading tools"
                ],
                browserOpened: true,
                note: "IB Gateway is running locally - your credentials stay secure on your machine"
              }, null, 2),
            },
          ],
        };
      } catch (browserError) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "Opening Interactive Brokers authentication interface...",
                authUrl: authUrl,
                mode: "manual",
                instructions: [
                  "1. Open the authentication URL below in your browser:",
                  `   ${authUrl}`,
                  "2. Accept any SSL certificate warnings (this is normal for localhost)",
                  "3. Complete the authentication process",
                  "4. Log in with your Interactive Brokers credentials",
                  "5. Once authenticated, you can use other trading tools"
                ],
                browserOpened: false,
                note: "Please open the URL manually. IB Gateway is running locally."
              }, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getAccountInfo(input: GetAccountInfoInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();
      
      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }
      
      const result = await this.context.ibClient.getAccountInfo();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getPositions(input: GetPositionsInput): Promise<ToolHandlerResult> {
    try {
      if (!input.accountId) {
        return {
          content: [
            {
              type: "text",
              text: "Account ID is required",
            },
          ],
        };
      }
      // Ensure Gateway is ready
      await this.ensureGatewayReady();
      
      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }
      
      const result = await this.context.ibClient.getPositions(input.accountId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getMarketData(input: GetMarketDataInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.getMarketData(
        input.symbol,
        input.exchange,
        input.fields,
        input.conid
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getHistoricalData(input: GetHistoricalDataInput): Promise<ToolHandlerResult> {
    try {
      await this.ensureGatewayReady();

      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.getHistoricalData(
        input.symbol,
        input.conid,
        input.period,
        input.bar,
        input.outsideRth
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getQuote(input: GetQuoteInput): Promise<ToolHandlerResult> {
    try {
      await this.ensureGatewayReady();

      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      // Use basic preset for quick quote
      const result = await this.context.ibClient.getMarketData(
        input.symbol,
        undefined,
        "basic"
      );

      // Extract and format the key fields
      const data = result.marketData?.[0] || result.marketData || {};
      const quote = {
        symbol: input.symbol,
        last: data["31"] || data.lastPrice,
        bid: data["84"] || data.bid,
        ask: data["86"] || data.ask,
        volume: data["87"] || data.volume,
        bidSize: data["88"] || data.bidSize,
        change: data["82"] || data.change,
        changePercent: data["83"] || data.changePercent
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(quote, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getOptionsChain(input: GetOptionsChainInput): Promise<ToolHandlerResult> {
    try {
      await this.ensureGatewayReady();

      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.getOptionsChain(
        input.symbol,
        input.conid,
        input.includeGreeks !== false // Default to true
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async findOptionContract(input: FindOptionContractInput): Promise<ToolHandlerResult> {
    try {
      await this.ensureGatewayReady();

      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.findOptionContract(
        input.symbol,
        input.expiration,
        input.strike,
        input.right,
        input.delta
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getPortfolioSummary(input: GetPortfolioSummaryInput): Promise<ToolHandlerResult> {
    try {
      await this.ensureGatewayReady();

      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.getPortfolioSummary(
        input.accountId,
        input.groupBy
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async placeStockOrder(input: PlaceStockOrderInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.placeStockOrder({
        accountId: input.accountId,
        symbol: input.symbol,
        action: input.action,
        orderType: input.orderType,
        quantity: input.quantity,
        price: input.price,
        stopPrice: input.stopPrice,
        suppressConfirmations: input.suppressConfirmations,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async placeOptionOrder(input: PlaceOptionOrderInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.placeOptionOrder({
        accountId: input.accountId,
        symbol: input.symbol,
        expiration: input.expiration,
        strike: input.strike,
        right: input.right,
        action: input.action,
        orderType: input.orderType,
        quantity: input.quantity,
        price: input.price,
        stopPrice: input.stopPrice,
        suppressConfirmations: input.suppressConfirmations,
        conid: input.conid,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getOrderStatus(input: GetOrderStatusInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();
      
      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }
      
      const result = await this.context.ibClient.getOrderStatus(input.orderId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getLiveOrders(input: GetLiveOrdersInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();
      
      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }
      
      // Always fetch all orders (don't pass accountId as it causes API errors)
      const result = await this.context.ibClient.getOrders();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async confirmOrder(input: ConfirmOrderInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.confirmOrder(input.replyId, input.messageIds);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  // ── Phase 4: Order Management Enhancement ────────────────────────────────

  async cancelOrder(input: CancelOrderInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const result = await this.context.ibClient.cancelOrder(input.orderId, input.accountId);
      return {
        content: [
          {
            type: "text",
            text: `Order ${input.orderId} cancelled successfully.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async modifyOrder(input: ModifyOrderInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const modifications = {
        quantity: input.quantity,
        price: input.price,
        stopPrice: input.stopPrice
      };

      const result = await this.context.ibClient.modifyOrder(input.orderId, input.accountId, modifications);
      return {
        content: [
          {
            type: "text",
            text: `Order ${input.orderId} modified successfully.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  // ── Phase 5: Contract Search & Discovery ──────────────────────────────────

  async searchContracts(input: SearchContractsInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const results = await this.context.ibClient.searchContracts(
        input.query,
        input.secType,
        input.exchange,
        input.currency,
        input.limit
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} contracts matching "${input.query}":\n\n${JSON.stringify(results, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getContractDetails(input: GetContractDetailsInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const details = await this.context.ibClient.getContractDetails(input.conid);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(details, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  // ── Phase 6: P&L and Trading History ──────────────────────────────────────

  async getPnL(input: GetPnLInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const pnlData = await this.context.ibClient.getPnL(input.accountId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(pnlData, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

  async getTradesHistory(input: GetTradesHistoryInput): Promise<ToolHandlerResult> {
    try {
      // Ensure Gateway is ready
      await this.ensureGatewayReady();

      // Ensure authentication in headless mode
      if (this.context.config.IB_HEADLESS_MODE) {
        await this.ensureAuth();
      }

      const trades = await this.context.ibClient.getTradesHistory(input.accountId, input.days);
      return {
        content: [
          {
            type: "text",
            text: `Found ${trades.length} trades:\n\n${JSON.stringify(trades, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: this.formatError(error),
          },
        ],
      };
    }
  }

}