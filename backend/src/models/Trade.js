const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    brokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Broker",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, trim: true, uppercase: true },
    stockName: { type: String, trim: true },
    // Instrument type — EQUITY, OPTIDX (Options on Index), FUTSTK (Futures on Stock), FUTIDX (Futures on Index)
    instrument: {
      type: String,
      enum: ["EQUITY", "OPTIDX", "FUTSTK", "FUTIDX"],
      default: "EQUITY",
    },
    tradeMode: {
      type: String,
      enum: ["mis", "nrml", "cnc"],
      default: "mis",
    },
    segment: {
      type: String,
      enum: ["intraday", "delivery", "futures", "options", "commodity"],
      default: "intraday",
    },
    side: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    // Options / Futures specific fields
    lotSize: { type: Number, default: 1, min: 1 },
    strikePrice: { type: Number, default: null },
    expiryDate: { type: Date, default: null },
    optionType: {
      type: String,
      enum: ["CE", "PE", ""],
      default: "",
    },
    entryPrice: { type: Number, required: true, min: 0 },
    exitPrice: { type: Number, min: 0 },
    buyPrice: { type: Number, min: 0 },
    sellPrice: { type: Number, min: 0 },
    ltp: { type: Number, default: 0.20 },
    ltpColor: { type: String, enum: ["green", "red"], default: "green" },
    totalBuy: { type: Number, default: 0 },
    totalSell: { type: Number, default: 0 },
    brokeragePercent: { type: Number, default: 0 },
    // "percentage" = % of turnover; "flat_per_lot" = flat ₹ per lot (used for Options/Futures)
    brokerageMode: {
      type: String,
      enum: ["percentage", "flat_per_lot"],
      default: "percentage",
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    tradedAt: { type: Date, default: Date.now },
    // Buy/Sell order execution timestamps for order timeline display
    orderTimeline: {
      buyOrderTime: { type: Date, default: null },
      buyOrderStatus: { type: String, default: "COMPLETE" },
      sellOrderTime: { type: Date, default: null },
      sellOrderStatus: { type: String, default: "COMPLETE" },
    },
    charges: {
      brokerage: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      exchangeFee: { type: Number, default: 0 },
      sebiFee: { type: Number, default: 0 },
      stampDuty: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    grossPnL: { type: Number, default: 0 },
    netPnL: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trade", tradeSchema);
