import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
export declare const configSchema: z.ZodObject<{
    IB_USERNAME: z.ZodOptional<z.ZodString>;
    IB_PASSWORD_AUTH: z.ZodOptional<z.ZodString>;
    IB_AUTH_TIMEOUT: z.ZodOptional<z.ZodNumber>;
    IB_HEADLESS_MODE: z.ZodOptional<z.ZodBoolean>;
    IB_PAPER_TRADING: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    IB_USERNAME?: string | undefined;
    IB_PASSWORD_AUTH?: string | undefined;
    IB_AUTH_TIMEOUT?: number | undefined;
    IB_HEADLESS_MODE?: boolean | undefined;
    IB_PAPER_TRADING?: boolean | undefined;
}, {
    IB_USERNAME?: string | undefined;
    IB_PASSWORD_AUTH?: string | undefined;
    IB_AUTH_TIMEOUT?: number | undefined;
    IB_HEADLESS_MODE?: boolean | undefined;
    IB_PAPER_TRADING?: boolean | undefined;
}>;
declare function IBMCP({ config: userConfig }: {
    config: z.infer<typeof configSchema>;
}): McpServer;
export default IBMCP;
