const Broker = require("../models/Broker");
const Trade = require("../models/Trade");
const { calculateCharges, roundCurrency } = require("../services/tradeMetrics");
const { normalizeTradeInput } = require("../services/tradeInput");

async function listTrades(req, res) {
  const { brokerId, status } = req.query;
  const query = brokerId ? { brokerId } : {};
  if (status) {
    query.status = status;
  }

  const trades = await Trade.find(query)
    .populate("clientId", "fullName clientCode")
    .sort({ tradedAt: -1, createdAt: -1 });

  res.json(trades);
}

async function createTrade(req, res) {
  const broker = await Broker.findById(req.body.brokerId);

  if (!broker) {
    return res.status(404).json({ message: "Broker not found." });
  }

  const payload = normalizeTradeInput(req.body);

  const metrics = calculateCharges(payload);
  const trade = await Trade.create({
    ...payload,
    brokerId: broker._id,
    totalBuy: metrics.totalBuy,
    totalSell: metrics.totalSell,
    charges: metrics.charges,
    grossPnL: metrics.grossPnL,
    netPnL: metrics.netPnL,
  });

  const populatedTrade = await Trade.findById(trade._id).populate("clientId", "fullName clientCode");
  res.status(201).json(populatedTrade);
}

async function updateTrade(req, res) {
  const existingTrade = await Trade.findById(req.params.tradeId);
  if (!existingTrade) {
    return res.status(404).json({ message: "Trade not found." });
  }

  const payload = normalizeTradeInput(req.body, existingTrade.toObject());

  const metrics = calculateCharges(payload);
  const trade = await Trade.findByIdAndUpdate(
    req.params.tradeId,
    {
      ...payload,
      totalBuy: metrics.totalBuy,
      totalSell: metrics.totalSell,
      charges: metrics.charges,
      grossPnL: metrics.grossPnL,
      netPnL: metrics.netPnL,
    },
    { new: true, runValidators: true }
  ).populate("clientId", "fullName clientCode");

  res.json(trade);
}

async function listHoldings(req, res) {
  const { brokerId } = req.query;
  const query = { status: "open" };
  if (brokerId) {
    query.brokerId = brokerId;
  }

  const trades = await Trade.find(query).populate("clientId", "fullName clientCode");
  const grouped = new Map();

  trades.forEach((trade) => {
    const key = `${trade.clientId?._id || "unknown"}:${trade.symbol}:${trade.side}`;
    const current = grouped.get(key) || {
      symbol: trade.symbol,
      side: trade.side,
      segment: trade.segment,
      quantity: 0,
      totalUnits: 0,
      averageEntry: 0,
      exposure: 0,
      client: trade.clientId,
    };

    const units = trade.quantity * (trade.lotSize || 1);
    const newQuantity = current.quantity + trade.quantity;
    const newTotalUnits = (current.totalUnits || 0) + units;
    const newExposure = current.exposure + trade.entryPrice * units;

    current.quantity = newQuantity;
    current.totalUnits = newTotalUnits;
    current.exposure = roundCurrency(newExposure);
    current.averageEntry = newTotalUnits ? roundCurrency(newExposure / newTotalUnits) : 0;
    grouped.set(key, current);
  });

  res.json(Array.from(grouped.values()));
}

module.exports = { listTrades, createTrade, updateTrade, listHoldings };
