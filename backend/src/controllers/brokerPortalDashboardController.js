const Client = require("../models/Client");
const Broker = require("../models/Broker");
const Trade = require("../models/Trade");
const { roundCurrency } = require("../services/tradeMetrics");

async function getBrokerOverview(req, res) {
  const brokerId = req.broker._id;

  const [clientCount, trades, recentTrades] = await Promise.all([
    Client.countDocuments({ brokerId }),
    Trade.find({ brokerId }).populate("clientId", "fullName clientCode idCode").sort({ tradedAt: -1 }),
    Trade.find({ brokerId }).populate("clientId", "fullName clientCode idCode").sort({ tradedAt: -1 }).limit(5),
  ]);

  const totals = trades.reduce(
    (acc, trade) => {
      const units = trade.quantity * (trade.lotSize || 1);
      const buyVal = trade.totalBuy ?? (units * (trade.entryPrice || 0));
      const sellVal = trade.totalSell ?? (units * (trade.exitPrice || 0));
      acc.turnover += buyVal + sellVal;
      acc.netPnL += trade.netPnL || 0;
      acc.openTrades += trade.status === "open" ? 1 : 0;
      return acc;
    },
    { turnover: 0, netPnL: 0, openTrades: 0 }
  );

  return res.json({
    brokerId,
    clientCount,
    tradeCount: trades.length,
    openTrades: totals.openTrades,
    turnover: roundCurrency(totals.turnover),
    netPnL: roundCurrency(totals.netPnL),
    recentTrades,
  });
}

/**
 * PATCH /overview/invoice-settings
 * Update invoice visibility toggles for the authenticated broker.
 */
async function updateInvoiceSettings(req, res) {
  const ALLOWED_KEYS = [
    "showChargesBreakup",
    "showTaxSummary",
    "showClientContact",
    "showStamp",
    "showFooterNotes",
    "showSignature",
    "showTrademark",
  ];

  const update = {};
  for (const key of ALLOWED_KEYS) {
    if (req.body[key] !== undefined) {
      update[`documents.${key}`] = Boolean(req.body[key]);
    }
  }

  if (!Object.keys(update).length) {
    return res.status(400).json({ message: "No valid invoice settings provided." });
  }

  const broker = await Broker.findByIdAndUpdate(
    req.broker._id,
    { $set: update },
    { new: true, runValidators: true }
  );

  return res.json({ documents: broker.documents });
}

module.exports = { getBrokerOverview, updateInvoiceSettings };
