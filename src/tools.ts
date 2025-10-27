import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IBClient } from "./ib-client.js";
import { IBGatewayManager } from "./gateway-manager.js";
import { ToolHandlers, ToolHandlerContext } from "./tool-handlers.js";
import {
  AuthenticateZodShape,
  GetAccountInfoZodShape,
  GetPositionsZodShape,
  GetMarketDataZodShape,
  PlaceStockOrderZodShape,
  PlaceOptionOrderZodShape,
  GetOrderStatusZodShape,
  GetLiveOrdersZodShape,
  ConfirmOrderZodShape
} from "./tool-definitions.js";

export function registerTools(
  server: McpServer, 
  ibClient: IBClient, 
  gatewayManager?: IBGatewayManager, 
  userConfig?: any
) {
  // Create handler context
  const context: ToolHandlerContext = {
    ibClient,
    gatewayManager,
    config: userConfig,
  };

  // Create handlers instance
  const handlers = new ToolHandlers(context);

  // Register authenticate tool (skip if in headless mode)
  if (!userConfig?.IB_HEADLESS_MODE) {
    server.tool(
      "authenticate",
      "Authenticate with Interactive Brokers. Usage: `{ \"confirm\": true }`.",
      AuthenticateZodShape,
      async (args) => await handlers.authenticate(args)
    );
  }

  // Register get_account_info tool
  server.tool(
    "get_account_info",
    "Get account information and balances. Usage: `{ \"confirm\": true }`.",
    GetAccountInfoZodShape,
    async (args) => await handlers.getAccountInfo(args)
  );

  // Register get_positions tool
  server.tool(
    "get_positions", 
    "Get current positions. Usage: `{}` or `{ \"accountId\": \"<id>\" }`.",
    GetPositionsZodShape,
    async (args) => await handlers.getPositions(args)
  );

  // Register get_market_data tool
  server.tool(
    "get_market_data",
    "Get real-time market data. Usage: `{ \"symbol\": \"AAPL\" }` or `{ \"symbol\": \"AAPL\", \"exchange\": \"NASDAQ\" }`.",
    GetMarketDataZodShape,
    async (args) => await handlers.getMarketData(args)
  );

  // Register place_stock_order tool
  server.tool(
    "place_stock_order",
    "Place a stock trading order (for equities only). Examples:\n" +
    "- Market buy: `{ \"accountId\":\"U12345\",\"symbol\":\"AAPL\",\"action\":\"BUY\",\"orderType\":\"MKT\",\"quantity\":10 }`\n" +
    "- Limit sell: `{ \"accountId\":\"U12345\",\"symbol\":\"AAPL\",\"action\":\"SELL\",\"orderType\":\"LMT\",\"quantity\":10,\"price\":185.5 }`\n" +
    "- Stop sell: `{ \"accountId\":\"U12345\",\"symbol\":\"TSLA\",\"action\":\"SELL\",\"orderType\":\"STP\",\"quantity\":5,\"stopPrice\":180 }`\n" +
    "- Fractional shares: `{ \"accountId\":\"U12345\",\"symbol\":\"SPY\",\"action\":\"BUY\",\"orderType\":\"MKT\",\"quantity\":\"1.5\" }`\n" +
    "- Auto-confirm: `{ \"accountId\":\"U12345\",\"symbol\":\"AAPL\",\"action\":\"BUY\",\"orderType\":\"MKT\",\"quantity\":1,\"suppressConfirmations\":true }`",
    PlaceStockOrderZodShape,
    async (args) => await handlers.placeStockOrder(args)
  );

  // Register place_option_order tool
  server.tool(
    "place_option_order",
    "Place an option trading order. Requires symbol, expiration, strike, and right (C/P). Examples:\n" +
    "- Buy call: `{ \"accountId\":\"U12345\",\"symbol\":\"AAPL\",\"expiration\":\"20250117\",\"strike\":150,\"right\":\"C\",\"action\":\"BUY\",\"orderType\":\"MKT\",\"quantity\":1 }`\n" +
    "- Sell put limit: `{ \"accountId\":\"U12345\",\"symbol\":\"TSLA\",\"expiration\":\"250117\",\"strike\":200,\"right\":\"PUT\",\"action\":\"SELL\",\"orderType\":\"LMT\",\"quantity\":2,\"price\":5.5 }`\n" +
    "- With contract ID: `{ \"accountId\":\"U12345\",\"symbol\":\"SPY\",\"expiration\":\"20250117\",\"strike\":450,\"right\":\"C\",\"action\":\"BUY\",\"orderType\":\"MKT\",\"quantity\":1,\"conid\":12345678 }`\n" +
    "Note: Expiration format is YYYYMMDD or YYMMDD. Right can be 'C'/'CALL' or 'P'/'PUT'. Use 'conid' parameter if you know the exact contract ID.",
    PlaceOptionOrderZodShape,
    async (args) => await handlers.placeOptionOrder(args)
  );

  // Register get_order_status tool
  server.tool(
    "get_order_status",
    "Get the status of a specific order. Usage: `{ \"orderId\": \"12345\" }`.",
    GetOrderStatusZodShape,
    async (args) => await handlers.getOrderStatus(args)
  );

  // Register get_live_orders tool
  server.tool(
    "get_live_orders",
    "Get all live/open orders for monitoring and validation. Usage: `{}`. " +
    "This is the recommended way to validate that market orders were executed successfully after placing them.",
    GetLiveOrdersZodShape,
    async (args) => await handlers.getLiveOrders(args)
  );

  // Register confirm_order tool
  server.tool(
    "confirm_order",
    "Manually confirm an order that requires confirmation. Usage: `{ \"replyId\": \"742a95a7-55f6-4d67-861b-2fd3e2b61e3c\", \"messageIds\": [\"o10151\", \"o10153\"] }`.",
    ConfirmOrderZodShape,
    async (args) => await handlers.confirmOrder(args)
  );
}