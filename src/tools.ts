import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IBClient } from "./ib-client.js";
import { IBGatewayManager } from "./gateway-manager.js";
import { ToolHandlers, ToolHandlerContext } from "./tool-handlers.js";
import {
  AuthenticateZodShape,
  GetAccountInfoZodShape,
  GetPositionsZodShape,
  GetMarketDataZodShape,
  GetHistoricalDataZodShape,
  GetQuoteZodShape,
  GetOptionsChainZodShape,
  FindOptionContractZodShape,
  GetPortfolioSummaryZodShape,
  PlaceStockOrderZodShape,
  PlaceOptionOrderZodShape,
  GetOrderStatusZodShape,
  GetLiveOrdersZodShape,
  ConfirmOrderZodShape,
  CancelOrderZodShape,
  ModifyOrderZodShape,
  SearchContractsZodShape,
  GetContractDetailsZodShape,
  GetPnLZodShape,
  GetTradesHistoryZodShape
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

  // Register get_market_data tool (ENHANCED)
  server.tool(
    "get_market_data",
    "Get real-time market data with flexible field selection. Field presets: 'basic', 'detailed', 'options', 'fundamentals', 'all'. Examples:\n" +
    "- Basic: `{ \"symbol\": \"AAPL\", \"fields\": \"basic\" }`\n" +
    "- Detailed: `{ \"symbol\": \"AAPL\", \"fields\": \"detailed\" }`\n" +
    "- Options Greeks: `{ \"symbol\": \"SPY\", \"fields\": \"options\" }`\n" +
    "- Custom fields: `{ \"symbol\": \"AAPL\", \"fields\": [\"31\", \"84\", \"86\"] }`\n" +
    "- With conid: `{ \"symbol\": \"AAPL\", \"conid\": 265598 }`",
    GetMarketDataZodShape,
    async (args) => await handlers.getMarketData(args)
  );

  // Register get_historical_data tool (NEW)
  server.tool(
    "get_historical_data",
    "Get historical OHLCV price data. Examples:\n" +
    "- 1-day 5min bars: `{ \"symbol\": \"AAPL\", \"period\": \"1d\", \"bar\": \"5min\" }`\n" +
    "- 1-week 1hour bars: `{ \"symbol\": \"SPY\", \"period\": \"1w\", \"bar\": \"1h\" }`\n" +
    "- 1-month daily: `{ \"symbol\": \"TSLA\", \"period\": \"1m\", \"bar\": \"1d\" }`\n" +
    "- Include extended hours: `{ \"symbol\": \"AAPL\", \"period\": \"1d\", \"bar\": \"1min\", \"outsideRth\": true }`",
    GetHistoricalDataZodShape,
    async (args) => await handlers.getHistoricalData(args)
  );

  // Register get_quote tool (NEW)
  server.tool(
    "get_quote",
    "Get quick quote with last, bid, ask, volume, change. Simplified alternative to get_market_data. Examples:\n" +
    "- Stock: `{ \"symbol\": \"AAPL\" }`\n" +
    "- Option: `{ \"symbol\": \"AAPL\", \"type\": \"option\" }`",
    GetQuoteZodShape,
    async (args) => await handlers.getQuote(args)
  );

  // Register get_options_chain tool (NEW)
  server.tool(
    "get_options_chain",
    "Get complete options chain with strikes and expirations. Examples:\n" +
    "- Full chain: `{ \"symbol\": \"SPY\" }`\n" +
    "- With Greeks: `{ \"symbol\": \"AAPL\", \"includeGreeks\": true }`\n" +
    "- Direct conid: `{ \"symbol\": \"SPY\", \"conid\": 756733 }`",
    GetOptionsChainZodShape,
    async (args) => await handlers.getOptionsChain(args)
  );

  // Register find_option_contract tool (NEW)
  server.tool(
    "find_option_contract",
    "Find specific option contract by criteria. Examples:\n" +
    "- Nearest expiration ATM call: `{ \"symbol\": \"AAPL\", \"right\": \"C\" }`\n" +
    "- Specific strike: `{ \"symbol\": \"SPY\", \"strike\": 450, \"right\": \"P\" }`\n" +
    "- By expiration: `{ \"symbol\": \"TSLA\", \"expiration\": \"JAN25\", \"strike\": 200, \"right\": \"CALL\" }`",
    FindOptionContractZodShape,
    async (args) => await handlers.findOptionContract(args)
  );

  // Register get_portfolio_summary tool (NEW)
  server.tool(
    "get_portfolio_summary",
    "Get aggregated portfolio summary with positions and P&L. Examples:\n" +
    "- All accounts: `{}`\n" +
    "- Specific account: `{ \"accountId\": \"U12345\" }`\n" +
    "- Grouped by type: `{ \"groupBy\": \"secType\" }`",
    GetPortfolioSummaryZodShape,
    async (args) => await handlers.getPortfolioSummary(args)
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

  // ── Phase 4: Order Management Enhancement ────────────────────────────────

  // Register cancel_order tool
  server.tool(
    "cancel_order",
    "Cancel a live order. Examples:\n" +
    "- Cancel order: `{ \"orderId\": \"12345\", \"accountId\": \"U12345\" }`",
    CancelOrderZodShape,
    async (args) => await handlers.cancelOrder(args)
  );

  // Register modify_order tool
  server.tool(
    "modify_order",
    "Modify an existing order. Examples:\n" +
    "- Change quantity: `{ \"orderId\": \"12345\", \"accountId\": \"U12345\", \"quantity\": 20 }`\n" +
    "- Update limit price: `{ \"orderId\": \"12345\", \"accountId\": \"U12345\", \"price\": 155.50 }`\n" +
    "- Update stop price: `{ \"orderId\": \"12345\", \"accountId\": \"U12345\", \"stopPrice\": 145.00 }`",
    ModifyOrderZodShape,
    async (args) => await handlers.modifyOrder(args)
  );

  // ── Phase 5: Contract Search & Discovery ──────────────────────────────────

  // Register search_contracts tool
  server.tool(
    "search_contracts",
    "Search for contracts by symbol or criteria. Examples:\n" +
    "- Search stocks: `{ \"query\": \"AAPL\", \"secType\": \"STK\" }`\n" +
    "- Search options: `{ \"query\": \"SPY\", \"secType\": \"OPT\" }`\n" +
    "- Search with filters: `{ \"query\": \"TSLA\", \"secType\": \"STK\", \"exchange\": \"NASDAQ\", \"currency\": \"USD\" }`\n" +
    "- Limit results: `{ \"query\": \"AAPL\", \"limit\": 5 }`",
    SearchContractsZodShape,
    async (args) => await handlers.searchContracts(args)
  );

  // Register get_contract_details tool
  server.tool(
    "get_contract_details",
    "Get detailed contract information. Examples:\n" +
    "- Get details: `{ \"conid\": 265598 }`",
    GetContractDetailsZodShape,
    async (args) => await handlers.getContractDetails(args)
  );

  // ── Phase 6: P&L and Trading History ──────────────────────────────────────

  // Register get_pnl tool
  server.tool(
    "get_pnl",
    "Get profit and loss information. Examples:\n" +
    "- All accounts: `{}`\n" +
    "- Specific account: `{ \"accountId\": \"U12345\" }`\n" +
    "- By period: `{ \"period\": \"day\" }` or `{ \"period\": \"week\" }`",
    GetPnLZodShape,
    async (args) => await handlers.getPnL(args)
  );

  // Register get_trades_history tool
  server.tool(
    "get_trades_history",
    "Get trades history. Examples:\n" +
    "- Last 7 days (default): `{}`\n" +
    "- Specific account: `{ \"accountId\": \"U12345\" }`\n" +
    "- Custom period: `{ \"days\": 30 }` for last 30 days",
    GetTradesHistoryZodShape,
    async (args) => await handlers.getTradesHistory(args)
  );
}