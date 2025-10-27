# MCP Tools Implementation Plan

This document outlines a comprehensive plan to create MCP tools that leverage all available IBKR Client Portal API data.

## Overview

We will create **15 MCP tools** organized into 5 categories to provide complete coverage of IBKR data.

---

## Phase 1: Enhanced Market Data Tools (Priority: HIGH)

### 1. `get_market_data` (Enhanced)
**Status:** EXISTS - NEEDS ENHANCEMENT

**Current Implementation:**
- Basic market data with hardcoded fields

**Proposed Enhancement:**
- Add `fields` parameter to allow custom field selection
- Add preset field groups (basic, detailed, options, fundamentals)
- Better error handling and data formatting
- Support for multiple contracts at once

**Parameters:**
```typescript
{
  symbol: string,
  exchange?: string,
  fields?: string[] | "basic" | "detailed" | "options" | "fundamentals",
  conid?: number  // Direct contract ID
}
```

**Use Cases:**
- Quick stock quotes
- Detailed market analysis
- Options Greeks monitoring
- Fundamental data retrieval

---

### 2. `get_historical_data` (NEW)
**Status:** NEW - HIGH PRIORITY

**Purpose:** Retrieve historical price data with flexible timeframes

**Parameters:**
```typescript
{
  symbol: string,
  conid?: number,
  period?: "1d" | "1w" | "1m" | "3m" | "6m" | "1y",
  bar?: "1min" | "5min" | "15min" | "30min" | "1h" | "1d" | "1w" | "1m",
  outsideRth?: boolean,
  startDate?: string,  // YYYYMMDD
  endDate?: string     // YYYYMMDD
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "bars": [
    {
      "time": "20250126-09:30:00",
      "open": 150.25,
      "high": 151.00,
      "low": 150.10,
      "close": 150.75,
      "volume": 1234567
    }
  ]
}
```

**Use Cases:**
- Backtesting strategies
- Chart generation
- Technical analysis
- Price pattern detection

---

### 3. `get_quote` (NEW - SIMPLIFIED)
**Status:** NEW - MEDIUM PRIORITY

**Purpose:** Quick, simple quote retrieval (wrapper around get_market_data)

**Parameters:**
```typescript
{
  symbol: string,
  type?: "stock" | "option"  // Default: stock
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "last": 150.75,
  "bid": 150.70,
  "ask": 150.80,
  "volume": 45678900,
  "change": 2.50,
  "changePercent": 1.68
}
```

**Use Cases:**
- Quick price checks
- Simple bot commands
- Portfolio value calculations

---

## Phase 2: Options-Specific Tools (Priority: HIGH)

### 4. `get_options_chain` (NEW)
**Status:** NEW - HIGH PRIORITY

**Purpose:** Retrieve complete options chain with strikes and expirations

**Parameters:**
```typescript
{
  symbol: string,
  conid?: number,  // Underlying contract ID
  exchange?: string,
  includeGreeks?: boolean,  // Default: true
  strikeCount?: number,     // Number of strikes around ATM (default: 10)
  expirationCount?: number  // Number of expirations (default: 4)
}
```

**Implementation Steps:**
1. Search for underlying contract
2. Get available expiration months
3. For each month, get available strikes
4. Retrieve market data with Greeks for each option
5. Format as options chain

**Response:**
```json
{
  "underlying": {
    "symbol": "AAPL",
    "conid": 265598,
    "lastPrice": 150.75
  },
  "expirations": [
    {
      "date": "2025-01-17",
      "daysToExpiry": 21,
      "strikes": [
        {
          "strike": 150,
          "call": {
            "conid": 12345,
            "last": 5.50,
            "bid": 5.45,
            "ask": 5.55,
            "volume": 1234,
            "impliedVol": 0.25,
            "delta": 0.55,
            "gamma": 0.05,
            "theta": -0.08
          },
          "put": {
            "conid": 12346,
            "last": 4.20,
            "bid": 4.15,
            "ask": 4.25,
            "volume": 987,
            "impliedVol": 0.24,
            "delta": -0.45,
            "gamma": 0.05,
            "theta": -0.07
          }
        }
      ]
    }
  ]
}
```

**Use Cases:**
- Options analysis
- Volatility surface visualization
- Options strategy selection
- Greeks monitoring

---

### 5. `find_option_contract` (NEW)
**Status:** NEW - MEDIUM PRIORITY

**Purpose:** Find specific option contract by criteria

**Parameters:**
```typescript
{
  symbol: string,
  expiration?: string,  // YYYYMMDD or "nearest" or "+30d"
  strike?: number | "ATM" | "ATM+5" | "ATM-5",
  right: "C" | "P" | "CALL" | "PUT",
  delta?: number  // Find option with specific delta
}
```

**Use Cases:**
- Finding specific options for strategies
- Delta-based option selection
- Expiration-based filtering

---

## Phase 3: Portfolio & Account Tools (Priority: MEDIUM)

### 6. `get_account_summary` (ENHANCED)
**Status:** EXISTS as get_account_info - NEEDS ENHANCEMENT

**Current:** Returns basic account list and summaries

**Enhancement:**
- More detailed formatting
- Calculate additional metrics
- Include margin information
- Show day trading status

**Parameters:**
```typescript
{
  accountId?: string,
  includeMargin?: boolean,
  includePositions?: boolean
}
```

---

### 7. `get_portfolio_summary` (NEW)
**Status:** NEW - MEDIUM PRIORITY

**Purpose:** Aggregated portfolio view across accounts

**Parameters:**
```typescript
{
  accountId?: string,
  groupBy?: "symbol" | "secType" | "currency"
}
```

**Response:**
```json
{
  "totalValue": 125000.50,
  "totalPnL": 5250.25,
  "dailyPnL": 325.75,
  "positions": {
    "stocks": { "count": 5, "value": 75000 },
    "options": { "count": 10, "value": 15000 },
    "cash": { "value": 35000.50 }
  },
  "topPositions": [
    {
      "symbol": "AAPL",
      "quantity": 100,
      "marketValue": 15075,
      "unrealizedPnL": 575,
      "pnlPercent": 3.96
    }
  ]
}
```

**Use Cases:**
- Portfolio overview
- Performance tracking
- Asset allocation analysis

---

### 8. `analyze_positions` (NEW)
**Status:** NEW - LOW PRIORITY

**Purpose:** Advanced position analysis with Greeks aggregation

**Parameters:**
```typescript
{
  accountId: string,
  includeGreeks?: boolean,
  groupBy?: "underlying" | "strategy"
}
```

**Use Cases:**
- Portfolio Greeks (delta, gamma exposure)
- Risk analysis
- Position sizing recommendations

---

## Phase 4: Contract Search & Discovery (Priority: MEDIUM)

### 9. `search_contracts` (NEW)
**Status:** NEW - MEDIUM PRIORITY

**Purpose:** Search for contracts by symbol, name, or criteria

**Parameters:**
```typescript
{
  query: string,
  secType?: "STK" | "OPT" | "FUT" | "CASH" | "BOND",
  exchange?: string,
  currency?: string,
  limit?: number
}
```

**Response:**
```json
{
  "results": [
    {
      "conid": 265598,
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "secType": "STK",
      "exchange": "NASDAQ",
      "currency": "USD"
    }
  ]
}
```

**Use Cases:**
- Symbol lookup
- Contract discovery
- Multi-asset search

---

### 10. `get_contract_details` (NEW)
**Status:** NEW - LOW PRIORITY

**Purpose:** Get detailed contract specifications

**Parameters:**
```typescript
{
  conid: number
}
```

**Response:**
```json
{
  "conid": 265598,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "secType": "STK",
  "exchange": "NASDAQ",
  "currency": "USD",
  "multiplier": 1,
  "tradingHours": "09:30-16:00 EST",
  "liquidHours": "09:30-16:00 EST"
}
```

---

## Phase 5: Order Management Enhancement (Priority: LOW)

### 11. `get_order_history` (NEW)
**Status:** NEW - LOW PRIORITY

**Purpose:** Retrieve historical orders (filled, cancelled)

**Note:** May require additional IBKR API endpoint - check availability

---

### 12. `cancel_order` (NEW)
**Status:** NEW - MEDIUM PRIORITY

**Purpose:** Cancel a live order

**Parameters:**
```typescript
{
  orderId: string,
  accountId: string
}
```

---

### 13. `modify_order` (NEW)
**Status:** NEW - LOW PRIORITY

**Purpose:** Modify an existing order

**Parameters:**
```typescript
{
  orderId: string,
  accountId: string,
  quantity?: number,
  price?: number,
  stopPrice?: number
}
```

---

## Phase 6: Utility & Helper Tools (Priority: LOW)

### 14. `calculate_greeks` (NEW)
**Status:** NEW - LOW PRIORITY

**Purpose:** Calculate option Greeks from price and parameters

**Note:** Client-side calculation, not API call

---

### 15. `get_market_status` (NEW)
**Status:** NEW - LOW PRIORITY

**Purpose:** Check if markets are open

**Response:**
```json
{
  "isOpen": true,
  "marketHours": "09:30-16:00 EST",
  "nextOpen": "2025-01-27 09:30:00 EST",
  "nextClose": "2025-01-26 16:00:00 EST"
}
```

---

## Implementation Priority & Timeline

### Phase 1 (Week 1-2): Core Market Data - IMMEDIATE
1. ✅ Enhanced `get_market_data` - 2 days
2. ✅ `get_historical_data` - 3 days
3. ✅ `get_quote` - 1 day

### Phase 2 (Week 2-3): Options Tools - HIGH PRIORITY
4. ✅ `get_options_chain` - 4 days
5. ✅ `find_option_contract` - 2 days

### Phase 3 (Week 3-4): Portfolio Tools - MEDIUM PRIORITY
6. ✅ Enhanced `get_account_summary` - 2 days
7. ✅ `get_portfolio_summary` - 3 days
8. ⏳ `analyze_positions` - 2 days (optional)

### Phase 4 (Week 4): Search & Discovery - MEDIUM PRIORITY
9. ✅ `search_contracts` - 2 days
10. ⏳ `get_contract_details` - 1 day (optional)

### Phase 5 (Week 5): Order Management - LOWER PRIORITY
11. ⏳ `get_order_history` - 2 days (check API availability)
12. ✅ `cancel_order` - 1 day
13. ⏳ `modify_order` - 2 days (optional)

### Phase 6 (Week 5-6): Utilities - AS NEEDED
14. ⏳ `calculate_greeks` - 1 day (if needed)
15. ⏳ `get_market_status` - 1 day (if needed)

---

## Recommended Implementation Order

### Immediate (This Week)
1. **Enhanced `get_market_data`** - Most used, needs field flexibility
2. **`get_historical_data`** - Essential for analysis and backtesting
3. **`get_options_chain`** - Critical for options trading

### Short Term (Next 2 Weeks)
4. **`search_contracts`** - Makes other tools easier to use
5. **`get_quote`** - Simplified interface for common use case
6. **`find_option_contract`** - Complements options chain
7. **Enhanced `get_account_summary`** - Better portfolio visibility

### Medium Term (Next Month)
8. **`get_portfolio_summary`** - Aggregated view
9. **`cancel_order`** - Essential order management
10. **`get_portfolio_summary`** - Portfolio analytics

### Long Term (As Needed)
11-15. Remaining tools based on user feedback and requirements

---

## Testing Strategy

### For Each Tool:
1. **Unit Tests** - Mock API responses
2. **Integration Tests** - Test with paper trading account
3. **Error Handling** - Test authentication, invalid symbols, rate limits
4. **Documentation** - Examples in README and tool descriptions

### Test Data Requirements:
- Paper trading account with IBKR
- Test symbols: AAPL, SPY, TSLA (stocks)
- Test options: SPY weekly options
- Test account with positions

---

## Documentation Updates Required

### README.md
- Update tools table
- Add examples for each new tool
- Add "Use Cases" section

### CLAUDE.md
- Document new architecture patterns
- Add helper functions and utilities
- Update testing strategies

### New Documentation
- Create `EXAMPLES.md` with real-world use cases
- Create `API_FIELD_REFERENCE.md` for all field codes
- Update `AVAILABLE_DATA.md` with tool mappings

---

## Success Metrics

✅ **Coverage**: All major IBKR data types accessible via tools
✅ **Usability**: Clear, intuitive tool names and parameters
✅ **Performance**: Response times under 2 seconds for non-historical data
✅ **Reliability**: Comprehensive error handling and retry logic
✅ **Documentation**: Every tool has examples and use cases

---

## Notes & Considerations

### Rate Limiting
- IBKR has rate limits (~60 requests per 10 minutes for historical data)
- Implement caching for frequently requested data
- Add rate limit warnings in tool responses

### Data Freshness
- Market data snapshot requires "pre-flight" request
- First call initializes stream, second call gets data
- Consider implementing automatic pre-flight handling

### Options Chain Complexity
- Full options chain can be 100+ contracts
- Implement filtering to reduce response size
- Add pagination or strike range limits

### Error Handling
- Authentication timeouts
- Symbol not found
- Market data not available
- Rate limit exceeded
- Invalid parameters

### Future Enhancements
- WebSocket streaming for real-time data
- Batch operations for multiple symbols
- Custom field presets saved by user
- Alert/notification system
- Trade ideas based on data analysis
