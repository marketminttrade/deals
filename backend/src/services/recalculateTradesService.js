const Trade = require("../models/Trade");
const { calculateCharges, roundCurrency } = require("./tradeMetrics");

async function recalculateExistingTrades() {
  try {
    const trades = await Trade.find({});
    if (!trades.length) return;

    let updatedCount = 0;
    for (const trade of trades) {
      const quantity = Number(trade.quantity || 0);
      const lotSize = Number(trade.lotSize || 1);
      const totalUnits = quantity * (lotSize > 0 ? lotSize : 1);

      const entryPrice = Number(trade.entryPrice ?? trade.buyPrice ?? 0);
      const exitValue = trade.exitPrice ?? trade.sellPrice;
      const hasExitPrice = exitValue !== "" && exitValue !== null && exitValue !== undefined;
      const exitPrice = Number(hasExitPrice ? exitValue : 0);

      const totalBuy = roundCurrency(totalUnits * entryPrice);
      const totalSell = roundCurrency(totalUnits * exitPrice);

      const metrics = calculateCharges({
        quantity,
        lotSize,
        entryPrice,
        exitPrice: hasExitPrice ? exitPrice : undefined,
        side: trade.side,
        brokeragePercent: trade.brokeragePercent,
        brokerageMode: trade.brokerageMode,
        segment: trade.segment,
        instrument: trade.instrument,
        ltp: trade.ltp,
      });

      trade.totalBuy = totalBuy;
      trade.totalSell = totalSell;
      trade.charges = metrics.charges;
      trade.grossPnL = metrics.grossPnL;
      trade.netPnL = metrics.netPnL;

      await trade.save();
      updatedCount++;
    }

    if (updatedCount > 0) {
      console.log(`[Trade Recalculation] Successfully recalculated metrics for ${updatedCount} existing trade(s).`);
    }
  } catch (err) {
    console.error("[Trade Recalculation Error]:", err.message);
  }
}

module.exports = { recalculateExistingTrades };
