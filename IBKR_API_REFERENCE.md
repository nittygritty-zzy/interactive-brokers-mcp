# IBKR Client Portal API Reference

This document lists all available market data endpoints and fields for the Interactive Brokers Client Portal Gateway API.

## Market Data Snapshot Fields

The `/iserver/marketdata/snapshot` endpoint supports the following field codes:

### Price Fields
| Code | Description |
|------|-------------|
| 31 | Last Price |
| 82 | Change Price |
| 83 | Change Percent |
| 84 | Bid Price |
| 86 | Ask Price |
| 70 | High (Daily) |
| 71 | Low (Daily) |

### Volume and Size Fields
| Code | Description |
|------|-------------|
| 87 | Volume |
| 88 | Bid Size |
| 85 | Ask Size |
| 7059 | Last Size |

### Position and P&L Fields
| Code | Description |
|------|-------------|
| 72 | Position |
| 73 | Market Value |
| 74 | Average Price |
| 75 | Unrealized PnL |
| 76 | Formatted Position |
| 77 | Formatted Unrealized PnL |
| 78 | Daily PnL |

### Contract Information Fields
| Code | Description |
|------|-------------|
| 55 | Symbol |
| 58 | Text |
| 6004 | Exchange |
| 6008 | Conid (Contract ID) |
| 6070 | Security Type |
| 6072 | Months |
| 6073 | Regular Expiry |
| 6457 | Underlying Conid |
| 6509 | Market Data Availability |
| 7051 | Company Name |
| 7094 | Conid + Exchange |
| 7219-7221 | Contract descriptions and listing exchange |

### Fundamental Data Fields
| Code | Description |
|------|-------------|
| 7280 | Industry |
| 7281 | Category |
| 7282 | Average Volume |
| 7283 | Dividend Amount |
| 7284 | Dividend Yield |
| 7285 | Ex-dividend Date |
| 7286 | Market Cap |
| 7287 | P/E Ratio |
| 7288 | EPS |
| 7289 | Cost Basis |
| 7290 | 52-Week High |
| 7291 | 52-Week Low |
| 7292 | Open Price |
| 7293 | Close Price |
| 7294 | Delta |
| 7295 | Gamma |
| 7296 | Theta |

### Options-Specific Fields
| Code | Description |
|------|-------------|
| 7633 | Implied Volatility |
| 7294 | Delta (Options Greek) |
| 7295 | Gamma (Options Greek) |
| 7296 | Theta (Options Greek) |

### Special Fields
| Code | Description |
|------|-------------|
| 6119 | Marker for market data delivery method |

## Available Endpoints

### Market Data Endpoints

#### 1. Market Data Snapshot
**Endpoint:** `GET /iserver/marketdata/snapshot`

**Parameters:**
- `conids` (required): Comma-separated list of contract IDs
- `fields` (required): Comma-separated list of field codes (see table above)

**Description:** Retrieve real-time market data for specified contracts with customizable fields.

**Note:** First request acts as a "pre-flight" request to start the data stream. Subsequent requests will return actual data.

---

#### 2. Historical Market Data
**Endpoint:** `GET /iserver/marketdata/history`

**Parameters:**
- `conid` (required): Contract ID
- `period` (optional): Time period (e.g., "1d", "1w", "1m", "1y")
- `bar` (optional): Bar size/interval (e.g., "1min", "5min", "1h", "1d")
- `outsideRth` (optional): Include data outside regular trading hours

**Description:** Fetch historical market data with configurable periods and bar intervals.

---

#### 3. Unsubscribe from Market Data
**Endpoint:** `GET /iserver/marketdata/{conid}/unsubscribe`

**Parameters:**
- `conid` (required): Contract ID to unsubscribe from

**Description:** Cancel market data subscription for a single contract.

---

#### 4. Unsubscribe All Market Data
**Endpoint:** `GET /iserver/marketdata/unsubscribeall`

**Description:** Cancel all active market data subscriptions.

---

### Contract Search and Definition Endpoints

#### 5. Security Definition Search
**Endpoint:** `GET /iserver/secdef/search`

**Parameters:**
- `symbol` (required): Symbol to search for
- `secType` (optional): Security type filter (e.g., "STK", "OPT", "FUT")
- `name` (optional): Include name in search (NOTE: omit when searching for options to use with strikes endpoint)

**Description:** Search for contract definitions by symbol.

---

#### 6. Options Strikes
**Endpoint:** `GET /iserver/secdef/strikes`

**Parameters:**
- `conid` (required): Contract ID of the underlying security
- `secType` (required): Security type ("OPT" for options, "FOP" for futures options)
- `month` (required): Contract month in MMMYY format (e.g., "JAN25", "FEB25")
- `exchange` (optional): Exchange code

**Description:** Returns available strike prices for options contracts.

**Response:**
```json
{
  "call": [100, 105, 110, 115, 120],
  "put": [100, 105, 110, 115, 120]
}
```

**Prerequisites:** Must call `/iserver/secdef/search` for the underlying first.

**Important:** Do not include `name` parameter in the search request when building options chains.

---

#### 7. Security Definition Info
**Endpoint:** `GET /iserver/secdef/info`

**Parameters:**
- `conid` (required): Contract ID
- `secType` (optional): Security type
- `month` (optional): Contract month
- `exchange` (optional): Exchange

**Description:** Get detailed contract information for specific contracts.

---

### Portfolio Endpoints

#### 8. Portfolio Accounts
**Endpoint:** `GET /portfolio/accounts`

**Description:** Get list of portfolio accounts.

---

#### 9. Account Summary
**Endpoint:** `GET /portfolio/{accountId}/summary`

**Parameters:**
- `accountId` (required): Account ID

**Description:** Get account summary including balances and equity.

---

#### 10. Portfolio Positions
**Endpoint:** `GET /portfolio/{accountId}/positions`

**Parameters:**
- `accountId` (required): Account ID

**Description:** Get current positions for an account.

---

### Order Management Endpoints

#### 11. Place Order
**Endpoint:** `POST /iserver/account/{accountId}/orders`

**Parameters:**
- `accountId` (required): Account ID

**Body:**
```json
{
  "orders": [{
    "conid": 265598,
    "orderType": "MKT",
    "side": "BUY",
    "quantity": 10,
    "tif": "DAY"
  }]
}
```

**Description:** Place trading orders.

---

#### 12. Get Live Orders
**Endpoint:** `GET /iserver/account/orders`

**Description:** Get all live/open orders.

---

#### 13. Get Order Status
**Endpoint:** `GET /iserver/account/order/status/{orderId}`

**Parameters:**
- `orderId` (required): Order ID

**Description:** Get status of a specific order.

---

## Typical Workflows

### Getting Stock Market Data
1. Search for contract: `GET /iserver/secdef/search?symbol=AAPL`
2. Get market data: `GET /iserver/marketdata/snapshot?conids=265598&fields=31,84,86,87,88`

### Getting Options Chain
1. Search for underlying: `GET /iserver/secdef/search?symbol=AAPL&secType=STK` (no `name` parameter!)
2. Get available strikes: `GET /iserver/secdef/strikes?conid=265598&secType=OPT&month=JAN25`
3. Get contract info: `GET /iserver/secdef/info?conid=optionConid`
4. Get market data: `GET /iserver/marketdata/snapshot?conids=optionConid&fields=31,84,86,7633`

### Getting Historical Data
1. Search for contract: `GET /iserver/secdef/search?symbol=AAPL`
2. Get historical data: `GET /iserver/marketdata/history?conid=265598&period=1d&bar=5min`

## Field Code Recommendations by Use Case

### Basic Stock Quote
Fields: `31,84,86,87,88,55`
- 31: Last Price
- 84: Bid Price
- 86: Ask Price
- 87: Volume
- 88: Bid Size
- 55: Symbol

### Detailed Stock Quote
Fields: `31,84,86,87,88,70,71,82,83,55,7051,7059`
- Includes: Last, Bid, Ask, Volume, High, Low, Change, Symbol, Company Name, Last Size

### Options Quote
Fields: `31,84,86,87,88,7633,7294,7295,7296`
- Includes: Last, Bid, Ask, Volume, Implied Vol, Delta, Gamma, Theta

### Position Monitoring
Fields: `72,73,74,75,77,78`
- Includes: Position, Market Value, Avg Price, Unrealized P&L, Daily P&L

### Fundamental Analysis
Fields: `7280,7281,7282,7283,7284,7286,7287,7288,7290,7291`
- Includes: Industry, Category, Avg Volume, Dividend, P/E, Market Cap, 52-week highs/lows
