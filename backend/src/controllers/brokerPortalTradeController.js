const Client = require("../models/Client");
const Trade = require("../models/Trade");
const { calculateCharges, roundCurrency } = require("../services/tradeMetrics");

const { normalizeTradeInput } = require("../services/tradeInput");

async function ensureBrokerClient(brokerId, clientId) {
  if (!require("mongoose").isObjectIdOrHexString(clientId)) return null;
  return Client.findOne({ _id: clientId, brokerId, isDeleted: { $ne: true } });
}

async function activeClientIds(brokerId) {
  return Client.find({ brokerId, isDeleted: { $ne: true } }).distinct("_id");
}

async function listBrokerTrades(req, res) {
  const ids = await activeClientIds(req.broker._id);
  const query = { brokerId: req.broker._id, clientId: { $in: ids } };

  if (req.query.clientId) {
    query.clientId = { $in: ids.filter((id) => String(id) === req.query.clientId) };
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.fromDate || req.query.toDate) {
    query.tradedAt = {};
    if (req.query.fromDate) {
      query.tradedAt.$gte = new Date(req.query.fromDate);
    }
    if (req.query.toDate) {
      const endDate = new Date(req.query.toDate);
      endDate.setHours(23, 59, 59, 999);
      query.tradedAt.$lte = endDate;
    }
  }

  const trades = await Trade.find(query)
    .populate("clientId", "fullName clientCode idCode phone address")
    .sort({ tradedAt: -1, createdAt: -1 });

  return res.json(trades);
}

async function createBrokerTrade(req, res) {
  const client = await ensureBrokerClient(req.broker._id, req.body.clientId);
  if (!client) {
    return res.status(404).json({ message: "Client not found for this broker." });
  }

  const payload = normalizeTradeInput(req.body);
  const metrics = calculateCharges(payload);
  const trade = await Trade.create({
    ...payload,
    brokerId: req.broker._id,
    totalBuy: metrics.totalBuy,
    totalSell: metrics.totalSell,
    charges: metrics.charges,
    grossPnL: metrics.grossPnL,
    netPnL: metrics.netPnL,
  });

  const populatedTrade = await Trade.findById(trade._id).populate("clientId", "fullName clientCode idCode phone address");
  return res.status(201).json(populatedTrade);
}

async function updateBrokerTrade(req, res) {
  const existingTrade = await Trade.findOne({ _id: req.params.tradeId, brokerId: req.broker._id });
  if (!existingTrade) {
    return res.status(404).json({ message: "Trade not found." });
  }

  const clientId = req.body.clientId || existingTrade.clientId;
  if (!await ensureBrokerClient(req.broker._id, existingTrade.clientId)) {
    return res.status(404).json({ message: "Client not found for this broker." });
  }
  const client = await ensureBrokerClient(req.broker._id, clientId);
  if (!client) {
    return res.status(404).json({ message: "Client not found for this broker." });
  }

  const payload = normalizeTradeInput({ ...req.body, clientId }, existingTrade.toObject());
  const metrics = calculateCharges(payload);
  const trade = await Trade.findOneAndUpdate(
    { _id: req.params.tradeId, brokerId: req.broker._id },
    {
      ...payload,
      totalBuy: metrics.totalBuy,
      totalSell: metrics.totalSell,
      charges: metrics.charges,
      grossPnL: metrics.grossPnL,
      netPnL: metrics.netPnL,
    },
    { new: true, runValidators: true }
  ).populate("clientId", "fullName clientCode idCode phone address");

  return res.json(trade);
}

async function deleteBrokerTrade(req, res) {
  const trade = await Trade.findOneAndDelete({ _id: req.params.tradeId, brokerId: req.broker._id, clientId: { $in: await activeClientIds(req.broker._id) } });
  if (!trade) {
    return res.status(404).json({ message: "Trade not found." });
  }

  return res.json({ message: "Trade deleted." });
}

async function deleteSelectedBrokerTrades(req, res) {
  const tradeIds = Array.isArray(req.body.tradeIds) ? req.body.tradeIds : [];
  if (!tradeIds.length) {
    return res.status(400).json({ message: "tradeIds is required." });
  }

  const result = await Trade.deleteMany({ _id: { $in: tradeIds }, brokerId: req.broker._id, clientId: { $in: await activeClientIds(req.broker._id) } });
  return res.json({ message: `${result.deletedCount} trade(s) deleted.` });
}

async function clearAllBrokerTrades(req, res) {
  const result = await Trade.deleteMany({ brokerId: req.broker._id, clientId: { $in: await activeClientIds(req.broker._id) } });
  return res.json({ message: `${result.deletedCount} trade(s) cleared.` });
}

async function listBrokerHoldings(req, res) {
  const trades = await Trade.find({ brokerId: req.broker._id, status: "open", clientId: { $in: await activeClientIds(req.broker._id) } }).populate(
    "clientId",
    "fullName clientCode idCode"
  );

  const grouped = new Map();

  trades.forEach((trade) => {
    const key = `${trade.clientId?._id || "unknown"}:${trade.symbol}:${trade.side}`;
    const current = grouped.get(key) || {
      symbol: trade.symbol,
      stockName: trade.stockName || trade.symbol,
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

  return res.json(Array.from(grouped.values()));
}

module.exports = {
  listBrokerTrades,
  createBrokerTrade,
  updateBrokerTrade,
  deleteBrokerTrade,
  deleteSelectedBrokerTrades,
  clearAllBrokerTrades,
  listBrokerHoldings,
};
