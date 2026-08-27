/**
 * StudioForge In-Game Marketplace L2 Limit Order Book
 * Price-time priority matching engine for player currency & item exchanges.
 */

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET' | 'FILL_OR_KILL';

export interface Order {
  orderId: string;
  playerId: string;
  itemId: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
  filledQuantity: number;
  timestamp: number;
}

export interface TradeExecution {
  tradeId: string;
  buyOrderId: string;
  sellOrderId: string;
  buyerPlayerId: string;
  sellerPlayerId: string;
  itemId: string;
  price: number;
  quantity: number;
  totalUsdEquivalent: number;
  timestamp: number;
}

export class OrderBook {
  private buyOrders: Order[] = [];
  private sellOrders: Order[] = [];
  private trades: TradeExecution[] = [];

  placeOrder(order: Omit<Order, 'filledQuantity' | 'timestamp'>): { trades: TradeExecution[]; remainingOrder: Order | null } {
    const fullOrder: Order = {
      ...order,
      filledQuantity: 0,
      timestamp: Date.now(),
    };

    const executedTrades: TradeExecution[] = [];

    if (fullOrder.side === 'BUY') {
      this.matchBuyOrder(fullOrder, executedTrades);
      if (fullOrder.quantity > fullOrder.filledQuantity && fullOrder.type === 'LIMIT') {
        this.buyOrders.push(fullOrder);
        this.buyOrders.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
      }
    } else {
      this.matchSellOrder(fullOrder, executedTrades);
      if (fullOrder.quantity > fullOrder.filledQuantity && fullOrder.type === 'LIMIT') {
        this.sellOrders.push(fullOrder);
        this.sellOrders.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
      }
    }

    return {
      trades: executedTrades,
      remainingOrder: fullOrder.quantity > fullOrder.filledQuantity ? fullOrder : null,
    };
  }

  private matchBuyOrder(buyOrder: Order, trades: TradeExecution[]): void {
    let i = 0;
    while (i < this.sellOrders.length && buyOrder.filledQuantity < buyOrder.quantity) {
      const sellOrder = this.sellOrders[i];
      if (buyOrder.type === 'LIMIT' && sellOrder.price > buyOrder.price) break;

      const remainingBuy = buyOrder.quantity - buyOrder.filledQuantity;
      const remainingSell = sellOrder.quantity - sellOrder.filledQuantity;
      const matchQty = Math.min(remainingBuy, remainingSell);
      const executionPrice = sellOrder.price;

      buyOrder.filledQuantity += matchQty;
      sellOrder.filledQuantity += matchQty;

      const trade: TradeExecution = {
        tradeId: `TR_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        buyOrderId: buyOrder.orderId,
        sellOrderId: sellOrder.orderId,
        buyerPlayerId: buyOrder.playerId,
        sellerPlayerId: sellOrder.playerId,
        itemId: buyOrder.itemId,
        price: executionPrice,
        quantity: matchQty,
        totalUsdEquivalent: matchQty * executionPrice,
        timestamp: Date.now(),
      };

      trades.push(trade);
      this.trades.push(trade);

      if (sellOrder.filledQuantity >= sellOrder.quantity) {
        this.sellOrders.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  private matchSellOrder(sellOrder: Order, trades: TradeExecution[]): void {
    let i = 0;
    while (i < this.buyOrders.length && sellOrder.filledQuantity < sellOrder.quantity) {
      const buyOrder = this.buyOrders[i];
      if (sellOrder.type === 'LIMIT' && buyOrder.price < sellOrder.price) break;

      const remainingSell = sellOrder.quantity - sellOrder.filledQuantity;
      const remainingBuy = buyOrder.quantity - buyOrder.filledQuantity;
      const matchQty = Math.min(remainingSell, remainingBuy);
      const executionPrice = buyOrder.price;

      sellOrder.filledQuantity += matchQty;
      buyOrder.filledQuantity += matchQty;

      const trade: TradeExecution = {
        tradeId: `TR_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        buyOrderId: buyOrder.orderId,
        sellOrderId: sellOrder.orderId,
        buyerPlayerId: buyOrder.playerId,
        sellerPlayerId: sellOrder.playerId,
        itemId: sellOrder.itemId,
        price: executionPrice,
        quantity: matchQty,
        totalUsdEquivalent: matchQty * executionPrice,
        timestamp: Date.now(),
      };

      trades.push(trade);
      this.trades.push(trade);

      if (buyOrder.filledQuantity >= buyOrder.quantity) {
        this.buyOrders.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  getSpread(): { bestBid: number | null; bestAsk: number | null; spread: number | null } {
    const bestBid = this.buyOrders.length > 0 ? this.buyOrders[0].price : null;
    const bestAsk = this.sellOrders.length > 0 ? this.sellOrders[0].price : null;
    const spread = bestBid !== null && bestAsk !== null ? Math.round((bestAsk - bestBid) * 100) / 100 : null;
    return { bestBid, bestAsk, spread };
  }
}
