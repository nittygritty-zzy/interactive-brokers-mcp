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


## Features

- **Interactive Brokers API Integration**: Full trading capabilities including account management, position tracking, real-time and historical market data, options chain analysis, and order management (market, limit, and stop orders)
- **Comprehensive Market Data**: Real-time quotes with flexible field selection (basic, detailed, options Greeks, fundamentals), historical OHLCV data, and quick quote access
- **Advanced Options Support**: Complete options chain retrieval, option contract search by criteria, and options trading with Greeks
- **Portfolio Management**: Aggregated portfolio summaries with P&L tracking and grouping by security type
- **Flexible Authentication**: Choose between browser-based OAuth authentication or headless mode with credentials for automated environments
- **Simple Setup**: Run directly with `npx` - no Docker or additional installations required. Includes pre-configured IB Gateway and Java runtime for all platforms

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

## Troubleshooting

**Authentication Problems:**

- Use the web interface that opens automatically
- Complete any required two-factor authentication
- Try paper trading mode if live trading fails

## Support

- **This Server**: Open an issue in this repository.

## License

MIT License - see LICENSE file for details.
