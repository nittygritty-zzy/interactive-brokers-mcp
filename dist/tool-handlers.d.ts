import { IBClient } from "./ib-client.js";
import { IBGatewayManager } from "./gateway-manager.js";
import { AuthenticateInput, GetAccountInfoInput, GetPositionsInput, GetMarketDataInput, GetHistoricalDataInput, GetQuoteInput, GetOptionsChainInput, FindOptionContractInput, GetPortfolioSummaryInput, PlaceStockOrderInput, PlaceOptionOrderInput, GetOrderStatusInput, GetLiveOrdersInput, ConfirmOrderInput, CancelOrderInput, ModifyOrderInput, SearchContractsInput, GetContractDetailsInput, GetPnLInput, GetTradesHistoryInput } from "./tool-definitions.js";
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
export declare class ToolHandlers {
    private context;
    constructor(context: ToolHandlerContext);
    private ensureGatewayReady;
    private ensureAuth;
    private isAuthenticationError;
    private getAuthenticationErrorMessage;
    private formatError;
    authenticate(input: AuthenticateInput): Promise<ToolHandlerResult>;
    getAccountInfo(input: GetAccountInfoInput): Promise<ToolHandlerResult>;
    getPositions(input: GetPositionsInput): Promise<ToolHandlerResult>;
    getMarketData(input: GetMarketDataInput): Promise<ToolHandlerResult>;
    getHistoricalData(input: GetHistoricalDataInput): Promise<ToolHandlerResult>;
    getQuote(input: GetQuoteInput): Promise<ToolHandlerResult>;
    getOptionsChain(input: GetOptionsChainInput): Promise<ToolHandlerResult>;
    findOptionContract(input: FindOptionContractInput): Promise<ToolHandlerResult>;
    getPortfolioSummary(input: GetPortfolioSummaryInput): Promise<ToolHandlerResult>;
    placeStockOrder(input: PlaceStockOrderInput): Promise<ToolHandlerResult>;
    placeOptionOrder(input: PlaceOptionOrderInput): Promise<ToolHandlerResult>;
    getOrderStatus(input: GetOrderStatusInput): Promise<ToolHandlerResult>;
    getLiveOrders(input: GetLiveOrdersInput): Promise<ToolHandlerResult>;
    confirmOrder(input: ConfirmOrderInput): Promise<ToolHandlerResult>;
    cancelOrder(input: CancelOrderInput): Promise<ToolHandlerResult>;
    modifyOrder(input: ModifyOrderInput): Promise<ToolHandlerResult>;
    searchContracts(input: SearchContractsInput): Promise<ToolHandlerResult>;
    getContractDetails(input: GetContractDetailsInput): Promise<ToolHandlerResult>;
    getPnL(input: GetPnLInput): Promise<ToolHandlerResult>;
    getTradesHistory(input: GetTradesHistoryInput): Promise<ToolHandlerResult>;
}
