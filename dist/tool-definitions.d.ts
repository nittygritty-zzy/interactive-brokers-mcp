import { z } from "zod";
export declare const AuthenticateZodShape: {
    confirm: z.ZodLiteral<true>;
};
export declare const GetAccountInfoZodShape: {
    confirm: z.ZodLiteral<true>;
};
export declare const GetPositionsZodShape: {
    accountId: z.ZodString;
};
export declare const GetMarketDataZodShape: {
    symbol: z.ZodString;
    exchange: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodEnum<["basic", "detailed", "options", "fundamentals", "all"]>]>>;
    conid: z.ZodOptional<z.ZodNumber>;
};
export declare const GetHistoricalDataZodShape: {
    symbol: z.ZodString;
    conid: z.ZodOptional<z.ZodNumber>;
    period: z.ZodOptional<z.ZodEnum<["1d", "1w", "1m", "3m", "6m", "1y"]>>;
    bar: z.ZodOptional<z.ZodEnum<["1min", "2min", "3min", "5min", "10min", "15min", "30min", "1h", "2h", "3h", "4h", "8h", "1d", "1w", "1m"]>>;
    outsideRth: z.ZodOptional<z.ZodBoolean>;
};
export declare const GetQuoteZodShape: {
    symbol: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<["stock", "option"]>>;
};
export declare const GetOptionsChainZodShape: {
    symbol: z.ZodString;
    conid: z.ZodOptional<z.ZodNumber>;
    exchange: z.ZodOptional<z.ZodString>;
    includeGreeks: z.ZodOptional<z.ZodBoolean>;
    strikeCount: z.ZodOptional<z.ZodNumber>;
    expirationCount: z.ZodOptional<z.ZodNumber>;
};
export declare const FindOptionContractZodShape: {
    symbol: z.ZodString;
    expiration: z.ZodOptional<z.ZodString>;
    strike: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    right: z.ZodEnum<["C", "P", "CALL", "PUT"]>;
    delta: z.ZodOptional<z.ZodNumber>;
};
export declare const GetPortfolioSummaryZodShape: {
    accountId: z.ZodOptional<z.ZodString>;
    groupBy: z.ZodOptional<z.ZodEnum<["symbol", "secType", "currency"]>>;
};
export declare const PlaceStockOrderZodShape: {
    accountId: z.ZodString;
    symbol: z.ZodString;
    action: z.ZodEnum<["BUY", "SELL"]>;
    orderType: z.ZodEnum<["MKT", "LMT", "STP"]>;
    quantity: z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>;
    price: z.ZodOptional<z.ZodNumber>;
    stopPrice: z.ZodOptional<z.ZodNumber>;
    suppressConfirmations: z.ZodOptional<z.ZodBoolean>;
};
export declare const PlaceOptionOrderZodShape: {
    accountId: z.ZodString;
    symbol: z.ZodString;
    expiration: z.ZodString;
    strike: z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>;
    right: z.ZodEnum<["C", "P", "CALL", "PUT"]>;
    action: z.ZodEnum<["BUY", "SELL"]>;
    orderType: z.ZodEnum<["MKT", "LMT", "STP"]>;
    quantity: z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>;
    price: z.ZodOptional<z.ZodNumber>;
    stopPrice: z.ZodOptional<z.ZodNumber>;
    suppressConfirmations: z.ZodOptional<z.ZodBoolean>;
    conid: z.ZodOptional<z.ZodNumber>;
};
export declare const GetOrderStatusZodShape: {
    orderId: z.ZodString;
};
export declare const GetLiveOrdersZodShape: {};
export declare const ConfirmOrderZodShape: {
    replyId: z.ZodString;
    messageIds: z.ZodArray<z.ZodString, "many">;
};
export declare const CancelOrderZodShape: {
    orderId: z.ZodString;
    accountId: z.ZodString;
};
export declare const ModifyOrderZodShape: {
    orderId: z.ZodString;
    accountId: z.ZodString;
    quantity: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>>;
    price: z.ZodOptional<z.ZodNumber>;
    stopPrice: z.ZodOptional<z.ZodNumber>;
};
export declare const SearchContractsZodShape: {
    query: z.ZodString;
    secType: z.ZodOptional<z.ZodEnum<["STK", "OPT", "FUT", "CASH", "BOND"]>>;
    exchange: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
};
export declare const GetContractDetailsZodShape: {
    conid: z.ZodNumber;
};
export declare const GetPnLZodShape: {
    accountId: z.ZodOptional<z.ZodString>;
    period: z.ZodOptional<z.ZodEnum<["day", "week", "month", "year"]>>;
};
export declare const GetTradesHistoryZodShape: {
    accountId: z.ZodOptional<z.ZodString>;
    days: z.ZodOptional<z.ZodNumber>;
};
export declare const AuthenticateZodSchema: z.ZodObject<{
    confirm: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    confirm: true;
}, {
    confirm: true;
}>;
export declare const GetAccountInfoZodSchema: z.ZodObject<{
    confirm: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    confirm: true;
}, {
    confirm: true;
}>;
export declare const GetPositionsZodSchema: z.ZodObject<{
    accountId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accountId: string;
}, {
    accountId: string;
}>;
export declare const GetMarketDataZodSchema: z.ZodObject<{
    symbol: z.ZodString;
    exchange: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodEnum<["basic", "detailed", "options", "fundamentals", "all"]>]>>;
    conid: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    conid?: number | undefined;
    exchange?: string | undefined;
    fields?: string[] | "basic" | "detailed" | "options" | "fundamentals" | "all" | undefined;
}, {
    symbol: string;
    conid?: number | undefined;
    exchange?: string | undefined;
    fields?: string[] | "basic" | "detailed" | "options" | "fundamentals" | "all" | undefined;
}>;
export declare const GetHistoricalDataZodSchema: z.ZodObject<{
    symbol: z.ZodString;
    conid: z.ZodOptional<z.ZodNumber>;
    period: z.ZodOptional<z.ZodEnum<["1d", "1w", "1m", "3m", "6m", "1y"]>>;
    bar: z.ZodOptional<z.ZodEnum<["1min", "2min", "3min", "5min", "10min", "15min", "30min", "1h", "2h", "3h", "4h", "8h", "1d", "1w", "1m"]>>;
    outsideRth: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    conid?: number | undefined;
    period?: "1d" | "1w" | "1m" | "3m" | "6m" | "1y" | undefined;
    bar?: "1d" | "1w" | "1m" | "1min" | "2min" | "3min" | "5min" | "10min" | "15min" | "30min" | "1h" | "2h" | "3h" | "4h" | "8h" | undefined;
    outsideRth?: boolean | undefined;
}, {
    symbol: string;
    conid?: number | undefined;
    period?: "1d" | "1w" | "1m" | "3m" | "6m" | "1y" | undefined;
    bar?: "1d" | "1w" | "1m" | "1min" | "2min" | "3min" | "5min" | "10min" | "15min" | "30min" | "1h" | "2h" | "3h" | "4h" | "8h" | undefined;
    outsideRth?: boolean | undefined;
}>;
export declare const GetQuoteZodSchema: z.ZodObject<{
    symbol: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<["stock", "option"]>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    type?: "stock" | "option" | undefined;
}, {
    symbol: string;
    type?: "stock" | "option" | undefined;
}>;
export declare const GetOptionsChainZodSchema: z.ZodObject<{
    symbol: z.ZodString;
    conid: z.ZodOptional<z.ZodNumber>;
    exchange: z.ZodOptional<z.ZodString>;
    includeGreeks: z.ZodOptional<z.ZodBoolean>;
    strikeCount: z.ZodOptional<z.ZodNumber>;
    expirationCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    conid?: number | undefined;
    exchange?: string | undefined;
    includeGreeks?: boolean | undefined;
    strikeCount?: number | undefined;
    expirationCount?: number | undefined;
}, {
    symbol: string;
    conid?: number | undefined;
    exchange?: string | undefined;
    includeGreeks?: boolean | undefined;
    strikeCount?: number | undefined;
    expirationCount?: number | undefined;
}>;
export declare const FindOptionContractZodSchema: z.ZodObject<{
    symbol: z.ZodString;
    expiration: z.ZodOptional<z.ZodString>;
    strike: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    right: z.ZodEnum<["C", "P", "CALL", "PUT"]>;
    delta: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    right: "C" | "P" | "CALL" | "PUT";
    strike?: string | number | undefined;
    expiration?: string | undefined;
    delta?: number | undefined;
}, {
    symbol: string;
    right: "C" | "P" | "CALL" | "PUT";
    strike?: string | number | undefined;
    expiration?: string | undefined;
    delta?: number | undefined;
}>;
export declare const GetPortfolioSummaryZodSchema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    groupBy: z.ZodOptional<z.ZodEnum<["symbol", "secType", "currency"]>>;
}, "strip", z.ZodTypeAny, {
    accountId?: string | undefined;
    groupBy?: "symbol" | "secType" | "currency" | undefined;
}, {
    accountId?: string | undefined;
    groupBy?: "symbol" | "secType" | "currency" | undefined;
}>;
export declare const PlaceStockOrderZodSchema: z.ZodEffects<z.ZodObject<{
    accountId: z.ZodString;
    symbol: z.ZodString;
    action: z.ZodEnum<["BUY", "SELL"]>;
    orderType: z.ZodEnum<["MKT", "LMT", "STP"]>;
    quantity: z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>;
    price: z.ZodOptional<z.ZodNumber>;
    stopPrice: z.ZodOptional<z.ZodNumber>;
    suppressConfirmations: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    accountId: string;
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: number;
    price?: number | undefined;
    stopPrice?: number | undefined;
    suppressConfirmations?: boolean | undefined;
}, {
    symbol: string;
    accountId: string;
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: string | number;
    price?: number | undefined;
    stopPrice?: number | undefined;
    suppressConfirmations?: boolean | undefined;
}>, {
    symbol: string;
    accountId: string;
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: number;
    price?: number | undefined;
    stopPrice?: number | undefined;
    suppressConfirmations?: boolean | undefined;
}, {
    symbol: string;
    accountId: string;
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: string | number;
    price?: number | undefined;
    stopPrice?: number | undefined;
    suppressConfirmations?: boolean | undefined;
}>;
export declare const PlaceOptionOrderZodSchema: z.ZodEffects<z.ZodObject<{
    accountId: z.ZodString;
    symbol: z.ZodString;
    expiration: z.ZodString;
    strike: z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>;
    right: z.ZodEnum<["C", "P", "CALL", "PUT"]>;
    action: z.ZodEnum<["BUY", "SELL"]>;
    orderType: z.ZodEnum<["MKT", "LMT", "STP"]>;
    quantity: z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>;
    price: z.ZodOptional<z.ZodNumber>;
    stopPrice: z.ZodOptional<z.ZodNumber>;
    suppressConfirmations: z.ZodOptional<z.ZodBoolean>;
    conid: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    strike: number;
    accountId: string;
    expiration: string;
    right: "C" | "P" | "CALL" | "PUT";
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: number;
    conid?: number | undefined;
    price?: number | undefined;
    stopPrice?: number | undefined;
    suppressConfirmations?: boolean | undefined;
}, {
    symbol: string;
    strike: string | number;
    accountId: string;
    expiration: string;
    right: "C" | "P" | "CALL" | "PUT";
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: string | number;
    conid?: number | undefined;
    price?: number | undefined;
    stopPrice?: number | undefined;
    suppressConfirmations?: boolean | undefined;
}>, {
    symbol: string;
    strike: number;
    accountId: string;
    expiration: string;
    right: "C" | "P" | "CALL" | "PUT";
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: number;
    conid?: number | undefined;
    price?: number | undefined;
    stopPrice?: number | undefined;
    suppressConfirmations?: boolean | undefined;
}, {
    symbol: string;
    strike: string | number;
    accountId: string;
    expiration: string;
    right: "C" | "P" | "CALL" | "PUT";
    action: "BUY" | "SELL";
    orderType: "MKT" | "LMT" | "STP";
    quantity: string | number;
    conid?: number | undefined;
    price?: number | undefined;
    stopPrice?: number | undefined;
    suppressConfirmations?: boolean | undefined;
}>;
export declare const GetOrderStatusZodSchema: z.ZodObject<{
    orderId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orderId: string;
}, {
    orderId: string;
}>;
export declare const GetLiveOrdersZodSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const ConfirmOrderZodSchema: z.ZodObject<{
    replyId: z.ZodString;
    messageIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    messageIds: string[];
    replyId: string;
}, {
    messageIds: string[];
    replyId: string;
}>;
export declare const CancelOrderZodSchema: z.ZodObject<{
    orderId: z.ZodString;
    accountId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    accountId: string;
    orderId: string;
}, {
    accountId: string;
    orderId: string;
}>;
export declare const ModifyOrderZodSchema: z.ZodObject<{
    orderId: z.ZodString;
    accountId: z.ZodString;
    quantity: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodString, number, string>]>>;
    price: z.ZodOptional<z.ZodNumber>;
    stopPrice: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    accountId: string;
    orderId: string;
    quantity?: number | undefined;
    price?: number | undefined;
    stopPrice?: number | undefined;
}, {
    accountId: string;
    orderId: string;
    quantity?: string | number | undefined;
    price?: number | undefined;
    stopPrice?: number | undefined;
}>;
export declare const SearchContractsZodSchema: z.ZodObject<{
    query: z.ZodString;
    secType: z.ZodOptional<z.ZodEnum<["STK", "OPT", "FUT", "CASH", "BOND"]>>;
    exchange: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    secType?: "OPT" | "STK" | "FUT" | "CASH" | "BOND" | undefined;
    currency?: string | undefined;
    exchange?: string | undefined;
    limit?: number | undefined;
}, {
    query: string;
    secType?: "OPT" | "STK" | "FUT" | "CASH" | "BOND" | undefined;
    currency?: string | undefined;
    exchange?: string | undefined;
    limit?: number | undefined;
}>;
export declare const GetContractDetailsZodSchema: z.ZodObject<{
    conid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    conid: number;
}, {
    conid: number;
}>;
export declare const GetPnLZodSchema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    period: z.ZodOptional<z.ZodEnum<["day", "week", "month", "year"]>>;
}, "strip", z.ZodTypeAny, {
    period?: "day" | "week" | "month" | "year" | undefined;
    accountId?: string | undefined;
}, {
    period?: "day" | "week" | "month" | "year" | undefined;
    accountId?: string | undefined;
}>;
export declare const GetTradesHistoryZodSchema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    days: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    accountId?: string | undefined;
    days?: number | undefined;
}, {
    accountId?: string | undefined;
    days?: number | undefined;
}>;
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
