import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IBClient } from "./ib-client.js";
import { IBGatewayManager } from "./gateway-manager.js";
export declare function registerTools(server: McpServer, ibClient: IBClient, gatewayManager?: IBGatewayManager, userConfig?: any): void;
