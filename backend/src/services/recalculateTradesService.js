const { calculateCharges } = require("./tradeMetrics");
const { normalizeTradeInput, CALCULATION_VERSION } = require("./tradeInput");

function buildRecalculation(trade, overrides = {}) {
  const payload = normalizeTradeInput({ status: trade.status, ...overrides }, trade);
  const { totalBuy, totalSell, charges, grossPnL, netPnL } = calculateCharges(payload);
  const changes = { ...payload, totalBuy, totalSell, charges, grossPnL, netPnL };
  return {
    changes,
    report: {
      tradeId: String(trade._id),
      version: CALCULATION_VERSION,
      rate: payload.brokeragePercent,
      mode: payload.brokerageMode,
      before: { brokerage: trade.charges?.brokerage, netPnL: trade.netPnL, totalBuy: trade.totalBuy, totalSell: trade.totalSell },
      after: { brokerage: charges.brokerage, netPnL, totalBuy, totalSell },
      needsRateReview: trade.brokeragePercent === 20 && trade.brokerageMode === "percentage",
    },
  };
}

// Dry run by default. Applying requires an identified trade and an explicit intended rate/mode.
async function recalculateExistingTrades({ tradeId, apply = false, mode, rate } = {}) {
  const Trade = require("../models/Trade");
  if (apply && (!tradeId || mode === undefined || rate === undefined)) {
    throw new Error("Applying requires --trade-id, --mode and --rate. Run a dry run first to review differences.");
  }
  const query = tradeId ? { _id: tradeId } : { $or: [{ calculationVersion: { $lt: CALCULATION_VERSION } }, { calculationVersion: { $exists: false } }] };
  const overrides = {};
  if (mode !== undefined) overrides.brokerageMode = mode;
  if (rate !== undefined) overrides.brokeragePercent = rate;
  let count = 0;
  let failed = 0;
  for await (const trade of Trade.find(query).lean().cursor()) {
    count++;
    try {
      const { changes, report } = buildRecalculation(trade, overrides);
      if (apply) {
        const result = await Trade.updateOne({ _id: trade._id, updatedAt: trade.updatedAt }, { $set: changes }, { runValidators: true });
        if (!result.matchedCount) throw new Error("Trade changed during review; rerun the command.");
      }
      console.log(JSON.stringify({ ...report, applied: apply }));
    } catch (error) {
      failed++;
      console.error(JSON.stringify({ tradeId: String(trade._id), error: error.message, applied: false }));
    }
  }
  if (tradeId && !count) throw new Error("Trade not found.");
  if (failed) throw new Error(`${failed} trade(s) require correction before recalculation.`);
  return count;
}

if (require.main === module) {
  require("dotenv").config();
  const mongoose = require("mongoose");
  const { connectDatabase } = require("../config/database");
  const args = process.argv.slice(2);
  const value = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
  (async () => {
    await connectDatabase();
    await recalculateExistingTrades({ tradeId: value("--trade-id"), apply: args.includes("--apply"), mode: value("--mode"), rate: value("--rate") });
  })().catch((error) => { console.error(error.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}

module.exports = { recalculateExistingTrades, buildRecalculation };
