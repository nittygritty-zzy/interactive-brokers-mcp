# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An unofficial Model Context Protocol (MCP) server providing integration with Interactive Brokers' trading platform. The server enables AI assistants to interact with IB accounts for market data retrieval, position tracking, and trade execution. The project bundles IB Gateway and Java runtime for all platforms, requiring no additional installations.

## Build & Development Commands

### Build
```bash
npm run build
```
Compiles TypeScript to `dist/` and adds shebang to make the output executable.

### Development
```bash
npm run dev          # Run with tsx (development mode)
npm run dev:http     # Run with HTTP server mode for MCP
npm run watch        # Watch mode for TypeScript compilation
```

### Testing
```bash
npm test                          # Run all tests once
npm run test:watch                # Watch mode for tests
npm run test:ui                   # Interactive test UI
npm run test:coverage             # Run tests with coverage report
npx vitest run test/file.test.ts  # Run a single test file
```
Tests use Vitest with setup in `test/setup.ts`.

### Running the Server
```bash
npm start            # Run built version
npm run start:http   # Run with HTTP server mode
npx -y interactive-brokers-mcp  # Run via npx (production mode)
```

## Architecture

### Core Components

**Entry Point (`src/index.ts`)**
- Initializes MCP server with stdio or HTTP transport
- Parses command-line args and merges with environment variables (priority: args > env > defaults)
- Creates `IBGatewayManager` and `IBClient` instances
- Registers shutdown handlers that disconnect but don't kill Gateway (allows reuse across npx sessions)

**Gateway Manager (`src/gateway-manager.ts`)**
- Manages IB Gateway lifecycle (bundled Java-based Gateway)
- Fast startup: checks for existing Gateway on ports 5000-5009, reuses if found
- Background startup: non-blocking initialization for MCP plugin compatibility
- Port management: creates temp config files for alternative ports when needed
- Never kills Gateway processes on shutdown (leaves them running for next session)

**IB Client (`src/ib-client.ts`)**
- Axios-based HTTPS client for IB Gateway REST API
- Automatic authentication via interceptors (max 3 attempts)
- Session maintenance via `/tickle` endpoint (30-second intervals)
- Comprehensive request/response logging with unique request IDs
- Methods: `getAccountInfo()`, `getPositions()`, `getMarketData()`, `placeOrder()`, `confirmOrder()`, `getOrderStatus()`, `getOrders()`

**Tool Handlers (`src/tool-handlers.ts`)**
- Implements MCP tool logic with Gateway readiness checks
- Automatic headless authentication when `IB_HEADLESS_MODE=true`
- Graceful error handling with auth error detection
- Tools: authenticate, get_account_info, get_positions, get_market_data, place_order, get_order_status, get_live_orders, confirm_order

**Tool Definitions (`src/tool-definitions.ts`)**
- Zod schemas for MCP tool input validation
- Automatic type coercion (e.g., string to number for quantity/price)

**Headless Authenticator (`src/headless-auth.ts`)**
- Playwright-based automation for browser-less authentication
- Handles login, 2FA detection, paper trading mode selection
- Waits for IB client authentication status confirmation

**Configuration (`src/config.ts`)**
- Environment variables: `IB_GATEWAY_HOST`, `IB_GATEWAY_PORT`, `IB_USERNAME`, `IB_PASSWORD_AUTH`, `IB_AUTH_TIMEOUT`, `IB_HEADLESS_MODE`, `IB_PAPER_TRADING`
- Command-line args override environment variables

**Logger (`src/logger.ts`)**
- Centralized logging with startup banner and structured output

**Utilities**
- `src/utils/port-utils.ts`: Port availability checking and existing Gateway detection
- `src/utils/config-utils.ts`: Temporary config file management for alternative ports

### Authentication Flow

1. **Browser Mode (default)**: Opens IB Gateway auth URL in browser, user completes login manually
2. **Headless Mode**: Playwright automates login with provided credentials, handles 2FA prompts
3. Both modes: Session maintained via `/tickle` endpoint (30-second intervals)

### Gateway Lifecycle

1. **Startup**: Check for existing Gateway on ports 5000-5009
2. **Reuse**: If found, connect and update client port
3. **New Instance**: If not found, spawn new Gateway with bundled JRE
4. **Shutdown**: Disconnect without killing (allows reuse by next npx process)

### Port Management

- Default port: 5000
- Alternative ports: 5001-5009 (with temp config files)
- Port checking: HTTPS health check on `https://localhost:{port}/`
- Existing Gateway detection: checks all ports for active Gateway

## Development Notes

### TypeScript Configuration
- Target: ES2022 with ESNext modules
- Output: `dist/` directory with declarations
- Module resolution: node with ESM interop

### Package Structure
- Entry point: `dist/index.js` (executable)
- Binary: `ib-mcp` command
- Published files: `dist/`, `ib-gateway/`, `runtime/`, `install/`

### Error Handling
- Authentication errors: Detected by status codes (401, 403, 500) and error messages
- Gateway errors: Logged to stderr, non-WARNING messages are errors
- Headless auth errors: Falls back to browser mode or provides manual instructions

### Testing Strategy
- Unit tests in `test/` directory
- Mocking IB client and Gateway manager for tool handler tests
- Coverage excludes test files, dist, and config files

### Release Process
- Semantic Release with Conventional Commits
- GitHub Actions: `test.yml` (CI) and `release.yml` (automated publishing)
- Build runs on `prepublishOnly` hook
