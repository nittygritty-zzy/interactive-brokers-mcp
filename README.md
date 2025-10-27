# Interactive Brokers MCP Server

<div align="center">
<img src="https://www.interactivebrokers.com/images/web/logos/ib-logo-text-black.svg" alt="Interactive Brokers" width="300">
</div>

> **DISCLAIMER**: This is an **unofficial**, community-developed MCP server
> and is **NOT** affiliated with or endorsed by Interactive Brokers. This
> software is in **Alpha state** and may not work perfectly.

A Model Context Protocol (MCP) server that provides integration with Interactive
Brokers' trading platform. This server allows AI assistants to interact with
your IB account to retrieve market data, check positions, and place trades.

![Showcase of Interactive Brokers MCP](./IB-MCP.gif)

**🚀 22 MCP Tools | 📊 Real-time & Historical Data | 📈 Options Trading | 💼 Portfolio Management | 🔍 Contract Search | 📉 P&L Tracking**

---

## Table of Contents

- [Features](#features)
- [Security Notice](#security-notice)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Headless Mode Configuration](#headless-mode-configuration)
- [Configuration Variables](#configuration-variables)
- [Available MCP Tools](#available-mcp-tools)
- [Quick Start Guide](#quick-start-guide)
- [Detailed Examples](#detailed-examples)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [License](#license)


## Features

### Trading & Market Data
- **Real-time Market Data**: Flexible field selection with presets (basic, detailed, options Greeks, fundamentals)
- **Historical Data**: OHLCV data with configurable periods (1d to 1y) and bar sizes (1min to 1month)
- **Options Chain**: Complete options chain with strikes, expirations, and Greeks
- **Order Management**: Place, monitor, modify, and cancel orders (market, limit, stop)
- **Multi-Asset Support**: Stocks, options, futures, bonds, and forex

### Portfolio & Analysis
- **Account Management**: Real-time account balances and positions
- **P&L Tracking**: Profit and loss monitoring by account or aggregated
- **Portfolio Summary**: Aggregated portfolio view with grouping by security type
- **Trade History**: Historical trades with configurable lookback periods

### Contract & Symbol Discovery
- **Contract Search**: Multi-asset search with filters (exchange, currency, security type)
- **Contract Details**: Detailed specifications for any contract
- **Option Contract Finder**: Find specific options by strike, expiration, and right

### Automation & Integration
- **Flexible Authentication**: Browser-based OAuth or headless mode with credentials
- **Simple Setup**: Run with `npx` - no Docker required. Includes IB Gateway and Java runtime
- **MCP Protocol**: Standard Model Context Protocol for AI assistant integration

## Security Notice

**IMPORTANT WARNINGS:**

- **Financial Risk**: Trading involves substantial risk of loss. Always test
  with paper trading first.
- **Security**: This software handles sensitive financial data. Only run
  locally, never on public servers.
- **No Warranty**: This unofficial software comes with no warranties. Use at
  your own risk.
- **Not Financial Advice**: This tool is for automation only, not financial
  advice.

## Prerequisites

**No additional installations required!** This package includes:

- Pre-configured IB Gateway for all platforms (Linux, macOS, Windows)
- Java Runtime Environment (JRE) for IB Gateway
- All necessary dependencies

You only need:

- Interactive Brokers account (paper or live trading)
- Node.js 18+ (for running the MCP server)

## Quick Start

Add this MCP server to your Cursor/Claude configuration:

```json
{
  "mcpServers": {
    "interactive-brokers": {
      "command": "npx",
      "args": ["-y", "interactive-brokers-mcp"]
    }
  }
}
```

When you first use the server, a web browser window will automatically open for
the Interactive Brokers OAuth authentication flow. Log in with your IB
credentials to authorize the connection.

## Headless Mode Configuration

For automated environments or when you prefer not to use a browser for
authentication, you can enable headless mode by configuring it in your MCP
server configuration:

```json
{
  "mcpServers": {
    "interactive-brokers": {
      "command": "npx",
      "args": ["-y", "interactive-brokers-mcp"],
      "env": {
        "IB_HEADLESS_MODE": "true",
        "IB_USERNAME": "your_ib_username",
        "IB_PASSWORD_AUTH": "your_ib_password"
      }
    }
  }
}

```

In headless mode, the server will automatically authenticate using your
credentials without opening a browser window. This is useful for:

- Automated trading systems
- Server environments without a display
- CI/CD pipelines
- Situations where browser interaction is not desired

**Important**: Even in headless mode, Interactive Brokers may still require
two-factor authentication (2FA). When 2FA is triggered, the headless
authentication will wait for you to complete the 2FA process through your
configured method (mobile app, SMS, etc.) before proceeding.

To enable paper trading, add `"IB_PAPER_TRADING": "true"` to your environment variables:

```json
{
  "mcpServers": {
    "interactive-brokers": {
      "command": "npx",
      "args": ["-y", "interactive-brokers-mcp"],
      "env": {
        "IB_HEADLESS_MODE": "true",
        "IB_USERNAME": "your_ib_username",
        "IB_PASSWORD_AUTH": "your_ib_password",
        "IB_PAPER_TRADING": "true"
      }
    }
  }
}
```

**Security Note**: Store credentials securely and never commit them to version
control. Consider using environment variable files or secure credential
management systems.

## Configuration Variables

| Feature | Environment Variable | Command Line Argument |
|---------|---------------------|----------------------|
| Username | `IB_USERNAME` | `--ib-username` |
| Password | `IB_PASSWORD_AUTH` | `--ib-password-auth` |
| Headless Mode | `IB_HEADLESS_MODE` | `--ib-headless-mode` |
| Paper Trading | `IB_PAPER_TRADING` | `--ib-paper-trading` |
| Auth Timeout | `IB_AUTH_TIMEOUT` | `--ib-auth-timeout` |

## Available MCP Tools

### Market Data Tools

| Tool                    | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| `get_market_data`       | Real-time market data with flexible field selection (basic, detailed, options, fundamentals, all) |
| `get_historical_data`   | Historical OHLCV price data with flexible time periods and bar sizes |
| `get_quote`             | Quick quote with last, bid, ask, volume, and change             |

### Options Tools

| Tool                    | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| `get_options_chain`     | Complete options chain with strikes and expirations             |
| `find_option_contract`  | Find specific option contract by criteria (strike, expiration, right) |
| `place_option_order`    | Place option orders with strike, expiration, and right          |

### Account & Portfolio Tools

| Tool                    | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| `get_account_info`      | Retrieve account information and balances                       |
| `get_positions`         | Get current positions and P&L                                   |
| `get_portfolio_summary` | Aggregated portfolio summary with positions and P&L by security type |

### Trading & Order Management

| Tool                  | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `place_stock_order`   | Place stock orders (market, limit, or stop)               |
| `get_order_status`    | Check order execution status (stocks and options)         |
| `get_live_orders`     | Get all live/open orders for monitoring and validation    |
| `confirm_order`       | Manually confirm orders that require confirmation         |
| `cancel_order`        | Cancel a live order                                       |
| `modify_order`        | Modify an existing order (quantity, price, stop price)    |

### Contract Search & Discovery

| Tool                    | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| `search_contracts`      | Search for contracts by symbol or criteria (stocks, options, futures, etc.) |
| `get_contract_details`  | Get detailed contract specifications and information            |

### P&L and Trading History

| Tool                  | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `get_pnl`             | Get profit and loss information by account                |
| `get_trades_history`  | Get trades history with configurable lookback period      |

---

## Quick Start Guide

### 1. Check Your Account
```json
// Get account information
{ "confirm": true }
// Tool: get_account_info
```

### 2. Get Market Data
```json
// Quick quote
{ "symbol": "AAPL" }
// Tool: get_quote

// Detailed market data with options Greeks
{ "symbol": "SPY", "fields": "options" }
// Tool: get_market_data

// Historical data - last day with 5-minute bars
{ "symbol": "AAPL", "period": "1d", "bar": "5min" }
// Tool: get_historical_data
```

### 3. View Your Portfolio
```json
// Get current positions
{ "accountId": "U12345" }
// Tool: get_positions

// Get portfolio summary
{}
// Tool: get_portfolio_summary

// Get P&L
{ "accountId": "U12345" }
// Tool: get_pnl
```

### 4. Trade Stocks
```json
// Place market order
{
  "accountId": "U12345",
  "symbol": "AAPL",
  "action": "BUY",
  "orderType": "MKT",
  "quantity": 10
}
// Tool: place_stock_order

// Check live orders
{}
// Tool: get_live_orders

// Cancel an order
{ "orderId": "12345", "accountId": "U12345" }
// Tool: cancel_order
```

### 5. Options Trading
```json
// Get options chain
{ "symbol": "SPY", "includeGreeks": true }
// Tool: get_options_chain

// Find specific option
{ "symbol": "AAPL", "strike": 150, "right": "C", "expiration": "JAN25" }
// Tool: find_option_contract

// Place option order
{
  "accountId": "U12345",
  "symbol": "SPY",
  "expiration": "20250117",
  "strike": 450,
  "right": "C",
  "action": "BUY",
  "orderType": "MKT",
  "quantity": 1
}
// Tool: place_option_order
```

### 6. Contract Search
```json
// Search for stocks
{ "query": "AAPL", "secType": "STK" }
// Tool: search_contracts

// Get contract details
{ "conid": 265598 }
// Tool: get_contract_details
```

---

## Detailed Examples

### Stock Orders

Place stock orders using `place_stock_order`:
- Supports market (MKT), limit (LMT), and stop (STP) orders
- Fractional shares supported
- Auto-confirmation option available

Example:
```json
{
  "accountId": "U12345",
  "symbol": "AAPL",
  "action": "BUY",
  "orderType": "MKT",
  "quantity": 10
}
```

### Option Orders

Place option orders using `place_option_order`:
- Requires symbol, expiration (YYYYMMDD or YYMMDD), strike, and right (C/P or CALL/PUT)
- Supports market, limit, and stop orders
- Optional contract ID (conid) for direct specification

Example:
```json
{
  "accountId": "U12345",
  "symbol": "AAPL",
  "expiration": "20250117",
  "strike": 150,
  "right": "C",
  "action": "BUY",
  "orderType": "MKT",
  "quantity": 1
}
```

### Market Data

Get real-time market data with flexible field selection using `get_market_data`:

```json
// Basic quote
{
  "symbol": "AAPL",
  "fields": "basic"
}

// Detailed market data
{
  "symbol": "AAPL",
  "fields": "detailed"
}

// Options with Greeks
{
  "symbol": "SPY",
  "fields": "options"
}

// Custom fields
{
  "symbol": "AAPL",
  "fields": ["31", "84", "86", "87", "88"]
}
```

Get historical OHLCV data using `get_historical_data`:

```json
// 1-day with 5-minute bars
{
  "symbol": "AAPL",
  "period": "1d",
  "bar": "5min"
}

// 1-week with 1-hour bars
{
  "symbol": "SPY",
  "period": "1w",
  "bar": "1h"
}

// Include extended hours
{
  "symbol": "AAPL",
  "period": "1d",
  "bar": "1min",
  "outsideRth": true
}
```

Get quick quote using `get_quote`:

```json
{
  "symbol": "AAPL"
}
```

### Options Data

Get complete options chain using `get_options_chain`:

```json
// Full chain
{
  "symbol": "SPY"
}

// With Greeks
{
  "symbol": "AAPL",
  "includeGreeks": true
}

// Limited strikes and expirations
{
  "symbol": "SPY",
  "strikeCount": 10,
  "expirationCount": 3
}
```

Find specific option contract using `find_option_contract`:

```json
// ATM call for nearest expiration
{
  "symbol": "AAPL",
  "right": "C"
}

// Specific strike and expiration
{
  "symbol": "SPY",
  "expiration": "JAN25",
  "strike": 450,
  "right": "P"
}
```

### Portfolio Summary

Get aggregated portfolio summary using `get_portfolio_summary`:

```json
// All accounts
{}

// Specific account
{
  "accountId": "U12345"
}

// Grouped by security type
{
  "groupBy": "secType"
}
```

### Order Management

Cancel an order using `cancel_order`:

```json
{
  "orderId": "12345",
  "accountId": "U12345"
}
```

Modify an existing order using `modify_order`:

```json
// Change quantity
{
  "orderId": "12345",
  "accountId": "U12345",
  "quantity": 20
}

// Update limit price
{
  "orderId": "12345",
  "accountId": "U12345",
  "price": 155.50
}

// Update stop price
{
  "orderId": "12345",
  "accountId": "U12345",
  "stopPrice": 145.00
}
```

### Contract Search

Search for contracts using `search_contracts`:

```json
// Search stocks
{
  "query": "AAPL",
  "secType": "STK"
}

// Search options
{
  "query": "SPY",
  "secType": "OPT"
}

// Search with filters
{
  "query": "TSLA",
  "secType": "STK",
  "exchange": "NASDAQ",
  "currency": "USD",
  "limit": 5
}
```

Get contract details using `get_contract_details`:

```json
{
  "conid": 265598
}
```

### P&L and Trading History

Get profit and loss using `get_pnl`:

```json
// All accounts
{}

// Specific account
{
  "accountId": "U12345"
}
```

Get trades history using `get_trades_history`:

```json
// Last 7 days (default)
{}

// Specific account
{
  "accountId": "U12345"
}

// Custom period
{
  "days": 30
}
```

---

## Market Data Field Presets

The `get_market_data` tool supports convenient field presets for common use cases:

### `basic` - Quick Quote (6 fields)
Perfect for quick price checks:
- Last Price, Bid, Ask, Volume, Bid Size, Symbol

### `detailed` - Comprehensive Quote (12 fields)
Includes all basic fields plus:
- High, Low, Change, Change %, Company Name, Last Size

### `options` - Options with Greeks (9 fields)
Specialized for options trading:
- Last, Bid, Ask, Volume + Implied Volatility, Delta, Gamma, Theta

### `fundamentals` - Fundamental Data (10 fields)
For fundamental analysis:
- Industry, P/E Ratio, Market Cap, Dividend Yield, 52-week High/Low, EPS, etc.

### `all` - Complete Dataset (50+ fields)
Every available field for comprehensive analysis

### Custom Fields
You can also specify custom field arrays:
```json
{
  "symbol": "AAPL",
  "fields": ["31", "84", "86", "87", "7633"]
}
```

See [IBKR_API_REFERENCE.md](./IBKR_API_REFERENCE.md) for complete field code reference.

---

## Tips & Best Practices

### Trading
- **Always test with paper trading first** before using live accounts
- Use `get_live_orders` to validate order execution
- Set `suppressConfirmations: true` for automated trading workflows
- Monitor orders with `get_order_status` for status updates

### Market Data
- Use `get_quote` for simple price checks (faster than `get_market_data`)
- Use field presets for common scenarios instead of custom field arrays
- Historical data supports periods from 1d to 1y with various bar sizes

### Options
- Use `get_options_chain` to browse available strikes and expirations
- Use `find_option_contract` when you know specific criteria
- Greeks are available through the `options` field preset

### Portfolio Management
- `get_portfolio_summary` provides aggregated views with grouping
- `get_pnl` shows profit/loss by account
- `get_trades_history` supports lookback periods (default: 7 days)

---

## Troubleshooting

**Authentication Problems:**

- Use the web interface that opens automatically
- Complete any required two-factor authentication
- Try paper trading mode if live trading fails

## Support

- **This Server**: Open an issue in this repository.

## License

MIT License - see LICENSE file for details.
