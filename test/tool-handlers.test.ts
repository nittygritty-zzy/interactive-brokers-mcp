// test/tool-handlers.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolHandlers, ToolHandlerContext } from '../src/tool-handlers.js';
import { IBClient } from '../src/ib-client.js';
import { IBGatewayManager } from '../src/gateway-manager.js';

// Mock dependencies
vi.mock('../src/ib-client.js');
vi.mock('../src/gateway-manager.js');
vi.mock('../src/headless-auth.js');
vi.mock('open', () => ({ default: vi.fn() }));

describe('ToolHandlers', () => {
  let handlers: ToolHandlers;
  let mockIBClient: IBClient;
  let mockGatewayManager: IBGatewayManager;
  let context: ToolHandlerContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock IBClient
    mockIBClient = {
      checkAuthenticationStatus: vi.fn().mockResolvedValue(true),
      getAccountInfo: vi.fn().mockResolvedValue({ accounts: [] }),
      getPositions: vi.fn().mockResolvedValue([]),
      getMarketData: vi.fn().mockResolvedValue({ price: 150 }),
      placeStockOrder: vi.fn().mockResolvedValue({ orderId: '123' }),
      placeOptionOrder: vi.fn().mockResolvedValue({ orderId: '456' }),
      getOrderStatus: vi.fn().mockResolvedValue({ status: 'Filled' }),
      getOrders: vi.fn().mockResolvedValue([]),
      confirmOrder: vi.fn().mockResolvedValue({ confirmed: true }),
      cancelOrder: vi.fn().mockResolvedValue({ msg: 'Order cancelled' }),
      modifyOrder: vi.fn().mockResolvedValue({ msg: 'Order modified' }),
      searchContracts: vi.fn().mockResolvedValue([]),
      getContractDetails: vi.fn().mockResolvedValue({}),
      getPnL: vi.fn().mockResolvedValue({}),
      getTradesHistory: vi.fn().mockResolvedValue([]),
      destroy: vi.fn(),
      updatePort: vi.fn(),
    } as any;

    // Create mock GatewayManager
    mockGatewayManager = {
      ensureGatewayReady: vi.fn().mockResolvedValue(undefined),
      getCurrentPort: vi.fn().mockReturnValue(5000),
      start: vi.fn(),
      stop: vi.fn(),
    } as any;

    // Create context
    context = {
      ibClient: mockIBClient,
      gatewayManager: mockGatewayManager,
      config: {
        IB_HEADLESS_MODE: false,
        IB_GATEWAY_HOST: 'localhost',
        IB_GATEWAY_PORT: 5000,
      },
    };

    handlers = new ToolHandlers(context);
  });

  describe('getAccountInfo', () => {
    it('should return account information', async () => {
      const mockAccounts = [{ id: 'U12345', accountId: 'U12345' }];
      mockIBClient.getAccountInfo = vi.fn().mockResolvedValue({ accounts: mockAccounts });

      const result = await handlers.getAccountInfo({ confirm: true });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(mockGatewayManager.ensureGatewayReady).toHaveBeenCalled();
      expect(mockIBClient.getAccountInfo).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockIBClient.getAccountInfo = vi.fn().mockRejectedValue(new Error('API Error'));

      const result = await handlers.getAccountInfo({ confirm: true });

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('API Error');
    });
  });

  describe('getPositions', () => {
    it('should return positions for account', async () => {
      const mockPositions = [{ symbol: 'AAPL', position: 10 }];
      mockIBClient.getPositions = vi.fn().mockResolvedValue(mockPositions);

      const result = await handlers.getPositions({ accountId: 'U12345' });

      expect(result.content).toBeDefined();
      expect(mockIBClient.getPositions).toHaveBeenCalledWith('U12345');
    });

    it('should handle missing accountId', async () => {
      const result = await handlers.getPositions({} as any);

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('Account ID is required');
    });
  });

  describe('getMarketData', () => {
    it('should return market data for symbol', async () => {
      const mockData = { symbol: 'AAPL', price: 150.25 };
      mockIBClient.getMarketData = vi.fn().mockResolvedValue(mockData);

      const result = await handlers.getMarketData({ symbol: 'AAPL' });

      expect(result.content).toBeDefined();
      expect(mockIBClient.getMarketData).toHaveBeenCalledWith('AAPL', undefined, undefined, undefined);
    });

    it('should pass exchange and fields parameters', async () => {
      const mockData = { symbol: 'AAPL', price: 150.25 };
      mockIBClient.getMarketData = vi.fn().mockResolvedValue(mockData);

      await handlers.getMarketData({ symbol: 'AAPL', exchange: 'NASDAQ', fields: 'basic' });

      expect(mockIBClient.getMarketData).toHaveBeenCalledWith('AAPL', 'NASDAQ', 'basic', undefined);
    });
  });

  describe('placeStockOrder', () => {
    it('should place stock market order', async () => {
      const mockResponse = { orderId: '123', status: 'Submitted' };
      mockIBClient.placeStockOrder = vi.fn().mockResolvedValue(mockResponse);

      const orderInput = {
        accountId: 'U12345',
        symbol: 'AAPL',
        action: 'BUY' as const,
        orderType: 'MKT' as const,
        quantity: 10,
      };

      const result = await handlers.placeStockOrder(orderInput);

      expect(result.content).toBeDefined();
      expect(mockIBClient.placeStockOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'U12345',
          symbol: 'AAPL',
          action: 'BUY',
          orderType: 'MKT',
          quantity: 10,
        })
      );
    });

    it('should place stock limit order with price', async () => {
      const mockResponse = { orderId: '123', status: 'Submitted' };
      mockIBClient.placeStockOrder = vi.fn().mockResolvedValue(mockResponse);

      const orderInput = {
        accountId: 'U12345',
        symbol: 'AAPL',
        action: 'BUY' as const,
        orderType: 'LMT' as const,
        quantity: 10,
        price: 150.50,
      };

      await handlers.placeStockOrder(orderInput);

      expect(mockIBClient.placeStockOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 150.50,
        })
      );
    });

    it('should handle stock order placement errors', async () => {
      mockIBClient.placeStockOrder = vi.fn().mockRejectedValue(new Error('Order failed'));

      const orderInput = {
        accountId: 'U12345',
        symbol: 'AAPL',
        action: 'BUY' as const,
        orderType: 'MKT' as const,
        quantity: 10,
      };

      const result = await handlers.placeStockOrder(orderInput);

      expect(result.content[0].text).toContain('Order failed');
    });
  });

  describe('placeOptionOrder', () => {
    it('should place option market order', async () => {
      const mockResponse = { orderId: '456', status: 'Submitted' };
      mockIBClient.placeOptionOrder = vi.fn().mockResolvedValue(mockResponse);

      const orderInput = {
        accountId: 'U12345',
        symbol: 'AAPL',
        expiration: '20250117',
        strike: 150,
        right: 'C' as const,
        action: 'BUY' as const,
        orderType: 'MKT' as const,
        quantity: 1,
      };

      const result = await handlers.placeOptionOrder(orderInput);

      expect(result.content).toBeDefined();
      expect(mockIBClient.placeOptionOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'U12345',
          symbol: 'AAPL',
          expiration: '20250117',
          strike: 150,
          right: 'C',
          action: 'BUY',
          orderType: 'MKT',
          quantity: 1,
        })
      );
    });

    it('should place option limit order with price', async () => {
      const mockResponse = { orderId: '456', status: 'Submitted' };
      mockIBClient.placeOptionOrder = vi.fn().mockResolvedValue(mockResponse);

      const orderInput = {
        accountId: 'U12345',
        symbol: 'SPY',
        expiration: '250117',
        strike: 450,
        right: 'PUT' as const,
        action: 'SELL' as const,
        orderType: 'LMT' as const,
        quantity: 2,
        price: 5.5,
      };

      await handlers.placeOptionOrder(orderInput);

      expect(mockIBClient.placeOptionOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          price: 5.5,
          strike: 450,
          right: 'PUT',
        })
      );
    });

    it('should handle option order placement errors', async () => {
      mockIBClient.placeOptionOrder = vi.fn().mockRejectedValue(new Error('Option order failed'));

      const orderInput = {
        accountId: 'U12345',
        symbol: 'TSLA',
        expiration: '20250117',
        strike: 200,
        right: 'C' as const,
        action: 'BUY' as const,
        orderType: 'MKT' as const,
        quantity: 1,
      };

      const result = await handlers.placeOptionOrder(orderInput);

      expect(result.content[0].text).toContain('Option order failed');
    });
  });

  describe('getLiveOrders', () => {
    it('should return all live orders', async () => {
      const mockOrders = [{ orderId: '123', status: 'Working' }];
      mockIBClient.getOrders = vi.fn().mockResolvedValue(mockOrders);

      const result = await handlers.getLiveOrders({});

      expect(result.content).toBeDefined();
      expect(mockIBClient.getOrders).toHaveBeenCalledWith();
    });

    it('should always fetch all orders without account parameter', async () => {
      const mockOrders = [{ orderId: '123', status: 'Working' }];
      mockIBClient.getOrders = vi.fn().mockResolvedValue(mockOrders);

      const result = await handlers.getLiveOrders({});

      expect(mockIBClient.getOrders).toHaveBeenCalledWith();
      expect(result.content).toBeDefined();
    });
  });

  describe('getOrderStatus', () => {
    it('should return order status', async () => {
      const mockStatus = { orderId: '123', status: 'Filled' };
      mockIBClient.getOrderStatus = vi.fn().mockResolvedValue(mockStatus);

      const result = await handlers.getOrderStatus({ orderId: '123' });

      expect(result.content).toBeDefined();
      expect(mockIBClient.getOrderStatus).toHaveBeenCalledWith('123');
    });
  });

  describe('confirmOrder', () => {
    it('should confirm order', async () => {
      const mockResponse = { confirmed: true };
      mockIBClient.confirmOrder = vi.fn().mockResolvedValue(mockResponse);

      const result = await handlers.confirmOrder({
        replyId: 'reply-123',
        messageIds: ['msg1', 'msg2'],
      });

      expect(result.content).toBeDefined();
      expect(mockIBClient.confirmOrder).toHaveBeenCalledWith('reply-123', ['msg1', 'msg2']);
    });
  });

  describe('Headless Mode Authentication', () => {
    it('should trigger auth in headless mode', async () => {
      context.config.IB_HEADLESS_MODE = true;
      context.config.IB_USERNAME = 'testuser';
      context.config.IB_PASSWORD_AUTH = 'testpass';
      
      mockIBClient.checkAuthenticationStatus = vi.fn()
        .mockResolvedValueOnce(false) // First check: not authenticated
        .mockResolvedValueOnce(true);  // After auth: authenticated

      handlers = new ToolHandlers(context);

      const result = await handlers.getAccountInfo({ confirm: true });

      expect(result.content).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should format authentication errors', async () => {
      const authError = new Error('Authentication required');
      (authError as any).isAuthError = true;
      
      mockIBClient.getAccountInfo = vi.fn().mockRejectedValue(authError);

      const result = await handlers.getAccountInfo({ confirm: true });

      expect(result.content[0].text).toContain('Authentication required');
    });

    it('should format generic errors', async () => {
      mockIBClient.getAccountInfo = vi.fn().mockRejectedValue(new Error('Generic error'));

      const result = await handlers.getAccountInfo({ confirm: true });

      expect(result.content[0].text).toContain('Generic error');
    });

    it('should handle non-Error objects', async () => {
      mockIBClient.getAccountInfo = vi.fn().mockRejectedValue('String error');

      const result = await handlers.getAccountInfo({ confirm: true });

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('String error');
    });
  });

  describe('Phase 4: Order Management', () => {
    describe('cancelOrder', () => {
      it('should cancel order successfully', async () => {
        const mockResponse = { msg: 'Order cancelled successfully' };
        mockIBClient.cancelOrder = vi.fn().mockResolvedValue(mockResponse);

        const result = await handlers.cancelOrder({ orderId: '123', accountId: 'U12345' });

        expect(result.content).toBeDefined();
        expect(mockIBClient.cancelOrder).toHaveBeenCalledWith('123', 'U12345');
        expect(result.content[0].text).toContain('cancelled successfully');
      });

      it('should handle cancel order errors', async () => {
        mockIBClient.cancelOrder = vi.fn().mockRejectedValue(new Error('Cancel failed'));

        const result = await handlers.cancelOrder({ orderId: '123', accountId: 'U12345' });

        expect(result.content[0].text).toContain('Cancel failed');
      });
    });

    describe('modifyOrder', () => {
      it('should modify order successfully', async () => {
        const mockResponse = { msg: 'Order modified successfully' };
        mockIBClient.modifyOrder = vi.fn().mockResolvedValue(mockResponse);

        const result = await handlers.modifyOrder({
          orderId: '123',
          accountId: 'U12345',
          quantity: 20,
          price: 155.50
        });

        expect(result.content).toBeDefined();
        expect(mockIBClient.modifyOrder).toHaveBeenCalledWith('123', 'U12345', {
          quantity: 20,
          price: 155.50,
          stopPrice: undefined
        });
        expect(result.content[0].text).toContain('modified successfully');
      });

      it('should handle modify order errors', async () => {
        mockIBClient.modifyOrder = vi.fn().mockRejectedValue(new Error('Modify failed'));

        const result = await handlers.modifyOrder({ orderId: '123', accountId: 'U12345' });

        expect(result.content[0].text).toContain('Modify failed');
      });
    });
  });

  describe('Phase 5: Contract Search', () => {
    describe('searchContracts', () => {
      it('should search contracts successfully', async () => {
        const mockResults = [
          { conid: 265598, symbol: 'AAPL', secType: 'STK' },
          { conid: 12345, symbol: 'AAPL', secType: 'OPT' }
        ];
        mockIBClient.searchContracts = vi.fn().mockResolvedValue(mockResults);

        const result = await handlers.searchContracts({ query: 'AAPL' });

        expect(result.content).toBeDefined();
        expect(mockIBClient.searchContracts).toHaveBeenCalledWith('AAPL', undefined, undefined, undefined, undefined);
        expect(result.content[0].text).toContain('Found 2 contracts');
      });

      it('should search with filters', async () => {
        mockIBClient.searchContracts = vi.fn().mockResolvedValue([]);

        await handlers.searchContracts({
          query: 'AAPL',
          secType: 'STK',
          exchange: 'NASDAQ',
          currency: 'USD',
          limit: 5
        });

        expect(mockIBClient.searchContracts).toHaveBeenCalledWith('AAPL', 'STK', 'NASDAQ', 'USD', 5);
      });
    });

    describe('getContractDetails', () => {
      it('should get contract details', async () => {
        const mockDetails = {
          conid: 265598,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          secType: 'STK'
        };
        mockIBClient.getContractDetails = vi.fn().mockResolvedValue(mockDetails);

        const result = await handlers.getContractDetails({ conid: 265598 });

        expect(result.content).toBeDefined();
        expect(mockIBClient.getContractDetails).toHaveBeenCalledWith(265598);
      });
    });
  });

  describe('Phase 6: P&L and Trading History', () => {
    describe('getPnL', () => {
      it('should get P&L data', async () => {
        const mockPnL = {
          accountId: 'U12345',
          pnl: { totalPnL: 1000, dailyPnL: 50 }
        };
        mockIBClient.getPnL = vi.fn().mockResolvedValue(mockPnL);

        const result = await handlers.getPnL({ accountId: 'U12345' });

        expect(result.content).toBeDefined();
        expect(mockIBClient.getPnL).toHaveBeenCalledWith('U12345');
      });

      it('should get P&L for all accounts', async () => {
        mockIBClient.getPnL = vi.fn().mockResolvedValue([]);

        await handlers.getPnL({});

        expect(mockIBClient.getPnL).toHaveBeenCalledWith(undefined);
      });
    });

    describe('getTradesHistory', () => {
      it('should get trades history', async () => {
        const mockTrades = [
          { symbol: 'AAPL', quantity: 10, price: 150 },
          { symbol: 'TSLA', quantity: 5, price: 250 }
        ];
        mockIBClient.getTradesHistory = vi.fn().mockResolvedValue(mockTrades);

        const result = await handlers.getTradesHistory({ days: 30 });

        expect(result.content).toBeDefined();
        expect(mockIBClient.getTradesHistory).toHaveBeenCalledWith(undefined, 30);
        expect(result.content[0].text).toContain('Found 2 trades');
      });

      it('should use default days parameter', async () => {
        mockIBClient.getTradesHistory = vi.fn().mockResolvedValue([]);

        await handlers.getTradesHistory({});

        expect(mockIBClient.getTradesHistory).toHaveBeenCalledWith(undefined, undefined);
      });
    });
  });
});

