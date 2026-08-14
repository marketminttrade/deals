const Client = require("../models/Client");
const Trade = require("../models/Trade");
const { calculateCharges, roundCurrency } = require("../services/tradeMetrics");

function resolveSegmentFromTradeMode(tradeMode, fallbackSegment = "intraday") {
  switch (tradeMode) {
    case "nrml":
    case "cnc":
      return "delivery";
    case "mis":
      return "intraday";
    default:
      return fallbackSegment || "intraday";
  }
}

function resolveTradeMode(input) {
  if (input.tradeMode) {
    return String(input.tradeMode).trim().toLowerCase();
  }

  switch (input.segment) {
    case "delivery":
      return "cnc";
    case "intraday":
    default:
      return "mis";
  }
}

function normalizeTradeInput(input) {
  const quantity = Number(input.quantity || 0);
  const lotSize = Number(input.lotSize || 1);
  const totalUnits = quantity * (lotSize > 0 ? lotSize : 1);
  const entryPrice = Number(input.entryPrice ?? input.buyPrice ?? 0);
  const exitValue = input.sellPrice ?? input.exitPrice;
  const exitPrice = exitValue === "" || exitValue === null || exitValue === undefined ? undefined : Number(exitValue);
  const ltp = input.ltp !== "" && input.ltp !== null && input.ltp !== undefined ? Number(input.ltp) : (exitPrice ?? entryPrice ?? 0.20);
  const stockName = String(input.stockName || input.symbol || "").trim().toUpperCase();
  const brokeragePercent = Number(input.brokeragePercent || 0);
  const brokerageMode = input.brokerageMode || "percentage";
  const tradeMode = resolveTradeMode(input);
  const totalBuy = roundCurrency(totalUnits * entryPrice);
  const totalSell = roundCurrency(totalUnits * Number(exitPrice || 0));

  // Options / Futures specific
  const instrument = (input.instrument || "EQUITY").toUpperCase();
  const strikePrice = input.strikePrice != null ? Number(input.strikePrice) : null;
  const expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
  const optionType = ["CE", "PE"].includes((input.optionType || "").toUpperCase())
    ? input.optionType.toUpperCase()
    : "";

  // Order execution timeline
  const orderTimeline = {
    buyOrderTime: input.orderTimeline?.buyOrderTime ? new Date(input.orderTimeline.buyOrderTime) : null,
    buyOrderStatus: input.orderTimeline?.buyOrderStatus || "COMPLETE",
    sellOrderTime: input.orderTimeline?.sellOrderTime ? new Date(input.orderTimeline.sellOrderTime) : null,
    sellOrderStatus: input.orderTimeline?.sellOrderStatus || "COMPLETE",
  };

  return {
    clientId: input.clientId,
    symbol: stockName,
    stockName,
    instrument,
    tradeMode,
    segment: resolveSegmentFromTradeMode(tradeMode, input.segment),
    side: input.side || "buy",
    quantity,
    lotSize,
    strikePrice,
    expiryDate,
    optionType,
    entryPrice,
    exitPrice,
    buyPrice: entryPrice,
    sellPrice: exitPrice,
    ltp,
    ltpColor: ["green", "red"].includes(input.ltpColor) ? input.ltpColor : "green",
    totalBuy,
    totalSell,
    brokeragePercent,
    brokerageMode,
    orderTimeline,
    status: input.status || (exitPrice ? "closed" : "open"),
    tradedAt: input.tradedAt || new Date(),
  };
}

async function ensureBrokerClient(brokerId, clientId) {
  return Client.findOne({ _id: clientId, brokerId });
}

async function listBrokerTrades(req, res) {
  const query = { brokerId: req.broker._id };

  if (req.query.clientId) {
    query.clientId = req.query.clientId;
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
  const client = await ensureBrokerClient(req.broker._id, clientId);
  if (!client) {
    return res.status(404).json({ message: "Client not found for this broker." });
  }

  const payload = normalizeTradeInput({
    ...existingTrade.toObject(),
    ...req.body,
    clientId,
    buyPrice: req.body.buyPrice ?? req.body.entryPrice ?? existingTrade.buyPrice ?? existingTrade.entryPrice,
    entryPrice: req.body.entryPrice ?? req.body.buyPrice ?? existingTrade.entryPrice ?? existingTrade.buyPrice,
    sellPrice: req.body.sellPrice ?? req.body.exitPrice ?? existingTrade.sellPrice ?? existingTrade.exitPrice,
    exitPrice: req.body.exitPrice ?? req.body.sellPrice ?? existingTrade.exitPrice ?? existingTrade.sellPrice,
  });
  const metrics = calculateCharges(payload);
  const trade = await Trade.findOneAndUpdate(
    { _id: req.params.tradeId, brokerId: req.broker._id },
    {
      ...payload,
      charges: metrics.charges,
      grossPnL: metrics.grossPnL,
      netPnL: metrics.netPnL,
    },
    { new: true, runValidators: true }
  ).populate("clientId", "fullName clientCode idCode phone address");

  return res.json(trade);
}

async function deleteBrokerTrade(req, res) {
  const trade = await Trade.findOneAndDelete({ _id: req.params.tradeId, brokerId: req.broker._id });
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

  const result = await Trade.deleteMany({ _id: { $in: tradeIds }, brokerId: req.broker._id });
  return res.json({ message: `${result.deletedCount} trade(s) deleted.` });
}

async function clearAllBrokerTrades(req, res) {
  const result = await Trade.deleteMany({ brokerId: req.broker._id });
  return res.json({ message: `${result.deletedCount} trade(s) cleared.` });
}

async function listBrokerHoldings(req, res) {
  const trades = await Trade.find({ brokerId: req.broker._id, status: "open" }).populate(
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
