# Complete List of Data Available from IBKR Client Portal API

This document provides a comprehensive overview of all data that can be retrieved from the Interactive Brokers Client Portal Gateway API.

## 1. Real-Time Market Data

### Stock Market Data
- **Last Price** - Current trading price
- **Bid/Ask Prices** - Best bid and ask prices
- **Bid/Ask Sizes** - Number of shares at bid/ask
- **Volume** - Total shares traded
- **Last Size** - Size of last trade
- **High/Low** - Daily high and low prices
- **Open/Close** - Opening and closing prices
- **Change** - Price change (absolute and percentage)

### Options Market Data
All stock data fields plus:
- **Implied Volatility** - Option's implied volatility
- **Delta** - Rate of change of option price relative to underlying
- **Gamma** - Rate of change of delta
- **Theta** - Time decay of option value
- **Vega** (via calculation) - Sensitivity to volatility changes

### Fundamental Data
- **Company Name** - Full company name
- **Industry** - Industry classification
- **Category** - Business category
- **Market Cap** - Market capitalization
- **P/E Ratio** - Price-to-earnings ratio
- **EPS** - Earnings per share
- **Dividend Amount** - Dividend payment amount
- **Dividend Yield** - Dividend yield percentage
- **Ex-Dividend Date** - Date when dividend is no longer paid to new buyers
- **52-Week High/Low** - Yearly price range
- **Average Volume** - Average trading volume

### Contract Information
- **Symbol** - Ticker symbol
- **Contract ID (Conid)** - Unique contract identifier
- **Exchange** - Trading exchange
- **Security Type** - Type of security (STK, OPT, FUT, etc.)
- **Underlying Contract ID** - For derivatives, the underlying contract
- **Expiry Date** - For options and futures
- **Strike Price** - For options
- **Market Data Availability** - Status of market data feed

## 2. Historical Market Data

### Available Periods
- **Intraday**: 1 minute to multiple hours
- **Daily**: 1 day to multiple months
- **Weekly**: 1 week to multiple years
- **Monthly**: 1 month to multiple years

### Bar Intervals
- **1 minute, 2 minutes, 3 minutes, 5 minutes, 10 minutes, 15 minutes, 30 minutes**
- **1 hour, 2 hours, 3 hours, 4 hours, 8 hours**
- **1 day, 1 week, 1 month**

### Historical Data Points per Bar
- **Open** - Opening price
- **High** - Highest price
- **Low** - Lowest price
- **Close** - Closing price
- **Volume** - Trading volume
- **VWAP** (if available) - Volume-weighted average price

### Regular Trading Hours (RTH) Options
- **Inside RTH only** - Regular trading hours data
- **Outside RTH** - Extended hours data included

## 3. Options Chain Data

### Strike Prices
- **Call Strikes** - Available call option strike prices
- **Put Strikes** - Available put option strike prices
- **Strike Intervals** - Spacing between strikes

### Expiration Dates
- **Monthly Expirations** - Standard monthly expirations
- **Weekly Expirations** - Weekly expirations (where available)
- **Quarterly Expirations** - Quarterly expirations

### Option Contract Details
- **Option Symbol** - Full option symbol
- **Contract ID** - Unique identifier for each option
- **Underlying** - Underlying stock contract
- **Multiplier** - Contract size (usually 100 for equity options)
- **Exchange** - Trading venue

## 4. Portfolio & Account Data

### Account Information
- **Account ID** - Account identifier
- **Account Type** - Account classification
- **Base Currency** - Account base currency

### Account Summary
- **Net Liquidation Value** - Total account value
- **Cash Balance** - Available cash
- **Equity with Loan Value** - Total equity minus margin loan
- **Buying Power** - Available buying power
- **Excess Liquidity** - Cushion above margin requirements
- **Maintenance Margin** - Minimum equity requirement
- **Available Funds** - Funds available for trading
- **Gross Position Value** - Total position value
- **Day Trades Remaining** - Pattern day trader status

### Position Data
- **Symbol** - Position symbol
- **Position Size** - Number of shares/contracts
- **Market Value** - Current position value
- **Average Cost** - Average entry price
- **Unrealized P&L** - Current profit/loss
- **Realized P&L** - Closed position P&L
- **Daily P&L** - Today's profit/loss

## 5. Order Data

### Order Status Information
- **Order ID** - Unique order identifier
- **Status** - Order status (Submitted, Filled, Cancelled, etc.)
- **Symbol** - Traded symbol
- **Side** - BUY or SELL
- **Order Type** - MKT, LMT, STP, etc.
- **Quantity** - Order size
- **Filled Quantity** - Executed shares
- **Remaining Quantity** - Unfilled shares
- **Limit Price** - For limit orders
- **Stop Price** - For stop orders
- **Average Fill Price** - Execution price
- **Commissions** - Trading fees
- **Time in Force** - DAY, GTC, etc.
- **Order Time** - When order was placed
- **Fill Time** - When order was executed

### Live Orders
- **All Open Orders** - Currently active orders
- **Order Updates** - Real-time order status changes

## 6. Contract Search Data

### Search Results
- **Matching Contracts** - All contracts matching search criteria
- **Contract Descriptions** - Full contract names
- **Symbol Variations** - Different symbol formats
- **Exchange Listings** - Where contracts trade
- **Security Types** - Type classification

### Available Security Types
- **STK** - Stocks
- **OPT** - Options
- **FUT** - Futures
- **FOP** - Futures Options
- **CFD** - Contracts for Difference
- **BOND** - Bonds
- **FUND** - Mutual Funds
- **CASH** - Forex/Currency pairs
- **IND** - Indices

## 7. Market Data Snapshot Categories

### Quote Data
✅ Real-time prices (Last, Bid, Ask)
✅ Sizes (Bid Size, Ask Size, Last Size)
✅ Price changes ($ and %)
✅ Daily ranges (High, Low, Open, Close)
✅ Volume

### Greeks (Options)
✅ Delta
✅ Gamma
✅ Theta
✅ Implied Volatility

### Fundamentals
✅ Company information
✅ Financial ratios
✅ Dividend information
✅ Market statistics

### Position Data
✅ Current positions
✅ Average costs
✅ Profit/Loss metrics

## 8. Data Not Currently Available via Client Portal API

The following data is NOT available through the Client Portal Gateway:

❌ **Level 2 Market Data** (full order book depth)
❌ **Time & Sales** (tick-by-tick trade data)
❌ **Historical Implied Volatility**
❌ **News Feed** (market news and headlines)
❌ **Earnings Announcements**
❌ **Corporate Actions** (splits, mergers, etc.)
❌ **Scanner Results** (market scanners)
❌ **Watchlists**
❌ **Vega** (must be calculated from other Greeks)
❌ **Rho** (interest rate sensitivity)

## 9. Data Refresh Rates

### Real-Time Data
- **Snapshot updates**: On-demand (each API call)
- **Streaming via WebSocket**: Real-time updates when available
- **Throttling**: Subject to IB's rate limits

### Historical Data
- **Available on-demand**: Subject to pacing violations
- **Typical limit**: ~60 requests per 10 minutes

## 10. Use Cases and Data Combinations

### Basic Stock Trading
- Last price, Bid/Ask, Volume
- Historical charts (1min to 1day bars)
- Order status and positions

### Options Trading
- Option chains (strikes and expirations)
- Greeks (Delta, Gamma, Theta, IV)
- Underlying stock data
- Multi-leg option positions

### Portfolio Management
- All positions across accounts
- Unrealized and realized P&L
- Account balances and buying power
- Performance metrics

### Market Analysis
- Historical price data
- Volume analysis
- Fundamental ratios
- Industry/sector data

### Risk Management
- Position Greeks aggregation
- Margin requirements
- Portfolio value at risk
- Position limits

## Summary

The IBKR Client Portal API provides comprehensive access to:
- ✅ **40+ market data fields** for real-time quotes
- ✅ **Historical data** with flexible time periods and intervals
- ✅ **Complete options chains** with Greeks
- ✅ **Full account and position data**
- ✅ **Order management and status**
- ✅ **Fundamental company data**
- ✅ **Contract search and discovery**

This makes it suitable for:
- Automated trading systems
- Portfolio monitoring applications
- Market analysis tools
- Risk management systems
- Options analysis platforms
