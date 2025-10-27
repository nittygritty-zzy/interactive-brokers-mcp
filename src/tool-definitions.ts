// tool-definitions.ts
import { z } from "zod";

// ── Zod Schemas ──────────────────────────────────────────────────────────────
// Helper for tolerant number (allows "1", "1.5", or actual number for fractional shares)
const IntegerOrStringIntegerZod = z.union([
  z.number().positive(),
  z.string().regex(/^[0-9]+(\.[0-9]+)?$/).transform(val => parseFloat(val))
]);

// Zod Raw Shapes (for server.tool() method)
export const AuthenticateZodShape = {
  confirm: z.literal(true)
};

export const GetAccountInfoZodShape = {
  confirm: z.literal(true)
};

export const GetPositionsZodShape = {
  accountId: z.string()
};

export const GetMarketDataZodShape = {
  symbol: z.string(),
  exchange: z.string().optional(),
  fields: z.union([
    z.array(z.string()),
    z.enum(["basic", "detailed", "options", "fundamentals", "all"])
  ]).optional(),
  conid: z.number().optional()
};

export const GetHistoricalDataZodShape = {
  symbol: z.string(),
  conid: z.number().optional(),
  period: z.enum(["1d", "1w", "1m", "3m", "6m", "1y"]).optional(),
  bar: z.enum(["1min", "2min", "3min", "5min", "10min", "15min", "30min", "1h", "2h", "3h", "4h", "8h", "1d", "1w", "1m"]).optional(),
  outsideRth: z.boolean().optional()
};

export const GetQuoteZodShape = {
  symbol: z.string(),
  type: z.enum(["stock", "option"]).optional()
};

export const GetOptionsChainZodShape = {
  symbol: z.string(),
  conid: z.number().optional(),
  exchange: z.string().optional(),
  includeGreeks: z.boolean().optional(),
  strikeCount: z.number().optional(),
  expirationCount: z.number().optional()
};

export const FindOptionContractZodShape = {
  symbol: z.string(),
  expiration: z.string().optional(),
  strike: z.union([z.number(), z.string()]).optional(),
  right: z.enum(["C", "P", "CALL", "PUT"]),
  delta: z.number().optional()
};

export const GetPortfolioSummaryZodShape = {
  accountId: z.string().optional(),
  groupBy: z.enum(["symbol", "secType", "currency"]).optional()
};

export const PlaceStockOrderZodShape = {
  accountId: z.string(),
  symbol: z.string(),
  action: z.enum(["BUY", "SELL"]),
  orderType: z.enum(["MKT", "LMT", "STP"]),
  quantity: IntegerOrStringIntegerZod,
  price: z.number().optional(),
  stopPrice: z.number().optional(),
  suppressConfirmations: z.boolean().optional()
};

export const PlaceOptionOrderZodShape = {
  accountId: z.string(),
  symbol: z.string(),
  expiration: z.string(), // Format: YYYYMMDD or YYMMDD
  strike: z.union([z.number(), z.string().transform(val => parseFloat(val))]),
  right: z.enum(["C", "P", "CALL", "PUT"]),
  action: z.enum(["BUY", "SELL"]),
  orderType: z.enum(["MKT", "LMT", "STP"]),
  quantity: IntegerOrStringIntegerZod,
  price: z.number().optional(),
  stopPrice: z.number().optional(),
  suppressConfirmations: z.boolean().optional(),
  conid: z.number().optional() // Allow direct contract ID specification
};

export const GetOrderStatusZodShape = {
  orderId: z.string()
};

export const GetLiveOrdersZodShape = {};

export const ConfirmOrderZodShape = {
  replyId: z.string(),
  messageIds: z.array(z.string())
};

// Phase 4: Order Management Enhancement
export const CancelOrderZodShape = {
  orderId: z.string(),
  accountId: z.string()
};

export const ModifyOrderZodShape = {
  orderId: z.string(),
  accountId: z.string(),
  quantity: IntegerOrStringIntegerZod.optional(),
  price: z.number().optional(),
  stopPrice: z.number().optional()
};

// Phase 5: Contract Search & Discovery
export const SearchContractsZodShape = {
  query: z.string(),
  secType: z.enum(["STK", "OPT", "FUT", "CASH", "BOND"]).optional(),
  exchange: z.string().optional(),
  currency: z.string().optional(),
  limit: z.number().optional()
};

export const GetContractDetailsZodShape = {
  conid: z.number()
};

// Phase 6: P&L and Trading History
export const GetPnLZodShape = {
  accountId: z.string().optional(),
  period: z.enum(["day", "week", "month", "year"]).optional()
};

export const GetTradesHistoryZodShape = {
  accountId: z.string().optional(),
  days: z.number().optional() // Number of days to look back
};

// Full Zod Schemas (for validation if needed)
export const AuthenticateZodSchema = z.object(AuthenticateZodShape);

export const GetAccountInfoZodSchema = z.object(GetAccountInfoZodShape);

export const GetPositionsZodSchema = z.object(GetPositionsZodShape);

export const GetMarketDataZodSchema = z.object(GetMarketDataZodShape);

export const GetHistoricalDataZodSchema = z.object(GetHistoricalDataZodShape);

export const GetQuoteZodSchema = z.object(GetQuoteZodShape);

export const GetOptionsChainZodSchema = z.object(GetOptionsChainZodShape);

export const FindOptionContractZodSchema = z.object(FindOptionContractZodShape);

export const GetPortfolioSummaryZodSchema = z.object(GetPortfolioSummaryZodShape);

export const PlaceStockOrderZodSchema = z.object(PlaceStockOrderZodShape).refine(
  (data) => {
    if (data.orderType === "LMT" && data.price === undefined) {
      return false;
    }
    if (data.orderType === "STP" && data.stopPrice === undefined) {
      return false;
    }
    return true;
  },
  {
    message: "LMT orders require price, STP orders require stopPrice",
    path: ["price", "stopPrice"]
  }
);

export const PlaceOptionOrderZodSchema = z.object(PlaceOptionOrderZodShape).refine(
  (data) => {
    if (data.orderType === "LMT" && data.price === undefined) {
      return false;
    }
    if (data.orderType === "STP" && data.stopPrice === undefined) {
      return false;
    }
    return true;
  },
  {
    message: "LMT orders require price, STP orders require stopPrice",
    path: ["price", "stopPrice"]
  }
);

export const GetOrderStatusZodSchema = z.object(GetOrderStatusZodShape);

export const GetLiveOrdersZodSchema = z.object(GetLiveOrdersZodShape);

export const ConfirmOrderZodSchema = z.object(ConfirmOrderZodShape);

export const CancelOrderZodSchema = z.object(CancelOrderZodShape);

export const ModifyOrderZodSchema = z.object(ModifyOrderZodShape);

export const SearchContractsZodSchema = z.object(SearchContractsZodShape);

export const GetContractDetailsZodSchema = z.object(GetContractDetailsZodShape);

export const GetPnLZodSchema = z.object(GetPnLZodShape);

export const GetTradesHistoryZodSchema = z.object(GetTradesHistoryZodShape);

// ── TypeScript types (inferred from Zod schemas) ────────────────────────────
export type AuthenticateInput = z.infer<typeof AuthenticateZodSchema>;
export type GetAccountInfoInput = z.infer<typeof GetAccountInfoZodSchema>;
export type GetPositionsInput = z.infer<typeof GetPositionsZodSchema>;
export type GetMarketDataInput = z.infer<typeof GetMarketDataZodSchema>;
export type GetHistoricalDataInput = z.infer<typeof GetHistoricalDataZodSchema>;
export type GetQuoteInput = z.infer<typeof GetQuoteZodSchema>;
export type GetOptionsChainInput = z.infer<typeof GetOptionsChainZodSchema>;
export type FindOptionContractInput = z.infer<typeof FindOptionContractZodSchema>;
export type GetPortfolioSummaryInput = z.infer<typeof GetPortfolioSummaryZodSchema>;
export type PlaceStockOrderInput = z.infer<typeof PlaceStockOrderZodSchema>;
export type PlaceOptionOrderInput = z.infer<typeof PlaceOptionOrderZodSchema>;
export type GetOrderStatusInput = z.infer<typeof GetOrderStatusZodSchema>;
export type GetLiveOrdersInput = z.infer<typeof GetLiveOrdersZodSchema>;
export type ConfirmOrderInput = z.infer<typeof ConfirmOrderZodSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderZodSchema>;
export type ModifyOrderInput = z.infer<typeof ModifyOrderZodSchema>;
export type SearchContractsInput = z.infer<typeof SearchContractsZodSchema>;
export type GetContractDetailsInput = z.infer<typeof GetContractDetailsZodSchema>;
export type GetPnLInput = z.infer<typeof GetPnLZodSchema>;
export type GetTradesHistoryInput = z.infer<typeof GetTradesHistoryZodSchema>;
