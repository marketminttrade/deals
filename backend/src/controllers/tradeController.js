const Broker = require("../models/Broker");
const Trade = require("../models/Trade");
const { calculateCharges, roundCurrency } = require("../services/tradeMetrics");

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

  const quantity = Number(req.body.quantity || 0);
  const lotSize = Number(req.body.lotSize || 1);
  const totalUnits = quantity * (lotSize > 0 ? lotSize : 1);

  const payload = {
    ...req.body,
    symbol: String(req.body.symbol || req.body.stockName || "").trim().toUpperCase(),
    stockName: String(req.body.stockName || req.body.symbol || "").trim().toUpperCase(),
    quantity,
    lotSize,
    entryPrice: Number(req.body.entryPrice),
    exitPrice: req.body.exitPrice ? Number(req.body.exitPrice) : undefined,
    buyPrice: Number(req.body.buyPrice ?? req.body.entryPrice),
    sellPrice: req.body.exitPrice ? Number(req.body.sellPrice ?? req.body.exitPrice) : undefined,
    totalBuy: totalUnits * Number(req.body.entryPrice),
    totalSell: req.body.exitPrice ? totalUnits * Number(req.body.exitPrice) : 0,
    brokeragePercent: Number(req.body.brokeragePercent || 0),
  };

  const metrics = calculateCharges(payload);
  const trade = await Trade.create({
    ...payload,
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

  const payload = {
    ...existingTrade.toObject(),
    ...req.body,
  };

  payload.symbol = String(payload.symbol || payload.stockName || "").trim().toUpperCase();
  payload.stockName = String(payload.stockName || payload.symbol || "").trim().toUpperCase();

  if (payload.quantity !== undefined) {
    payload.quantity = Number(payload.quantity);
  }
  if (payload.lotSize !== undefined) {
    payload.lotSize = Number(payload.lotSize);
  }
  if (payload.entryPrice !== undefined) {
    payload.entryPrice = Number(payload.entryPrice);
  }
  if (payload.exitPrice !== undefined && payload.exitPrice !== null && payload.exitPrice !== "") {
    payload.exitPrice = Number(payload.exitPrice);
  }

  const quantity = Number(payload.quantity || 0);
  const lotSize = Number(payload.lotSize || 1);
  const totalUnits = quantity * (lotSize > 0 ? lotSize : 1);

  payload.buyPrice = Number(payload.buyPrice ?? payload.entryPrice);
  payload.sellPrice = payload.exitPrice !== undefined ? Number(payload.sellPrice ?? payload.exitPrice) : undefined;
  payload.totalBuy = totalUnits * Number(payload.entryPrice || 0);
  payload.totalSell = totalUnits * Number(payload.exitPrice || 0);
  payload.brokeragePercent = Number(payload.brokeragePercent || 0);

  const metrics = calculateCharges(payload);
  const trade = await Trade.findByIdAndUpdate(
    req.params.tradeId,
    {
      ...payload,
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
