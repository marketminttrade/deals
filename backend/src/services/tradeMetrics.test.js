const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateCharges } = require("./tradeMetrics");
const { normalizeTradeInput } = require("./tradeInput");
const { buildRecalculation } = require("./recalculateTradesService");

const equity = { stockName: "TEST", quantity: 1000, lotSize: 1, entryPrice: 200, exitPrice: 300, side: "buy", instrument: "EQUITY", brokerageMode: "percentage", brokeragePercent: 0.1 };

test("SS equity percentage baseline and signed net P&L", () => {
  const result = calculateCharges(equity);
  assert.equal(result.turnover, 500000);
  assert.equal(result.charges.brokerage, 500);
  assert.equal(result.grossPnL, 100000);
  assert.equal(result.netPnL, 99500);
  assert.equal(calculateCharges({ ...equity, side: "sell" }).netPnL, -100500);
});

test("LTP changes open P&L but never brokerage or turnover", () => {
  const result = calculateCharges({ ...equity, exitPrice: null, ltp: 250 });
  assert.equal(result.turnover, 200000);
  assert.equal(result.charges.brokerage, 200);
  assert.equal(result.netPnL, 49800);
});

test("paisa mode charges exactly one sell leg for long and short trades", () => {
  const input = { ...equity, brokerageMode: "paisa_per_share", brokeragePercent: 5 };
  assert.equal(calculateCharges(input).charges.brokerage, 50);
  assert.equal(calculateCharges({ ...input, exitPrice: null }).charges.brokerage, 0);
  assert.equal(calculateCharges({ ...input, exitPrice: null, side: "sell" }).charges.brokerage, 50);
  assert.equal(calculateCharges({ ...input, side: "sell" }).charges.brokerage, 50);
});

test("flat per executed order charges one or two orders, including a zero-price exit", () => {
  const input = { ...equity, brokerageMode: "flat_per_order", brokeragePercent: 20 };
  assert.equal(calculateCharges({ ...input, exitPrice: null }).charges.brokerage, 20);
  assert.equal(calculateCharges(input).charges.brokerage, 40);
  assert.equal(calculateCharges({ ...input, exitPrice: 0 }).charges.brokerage, 40);
});

test("derivatives use lots for flat brokerage and physical units for P&L", () => {
  const result = calculateCharges({ ...equity, instrument: "OPTIDX", quantity: 2, lotSize: 25, entryPrice: 100, exitPrice: 120, brokerageMode: "flat_per_lot", brokeragePercent: 20 });
  assert.equal(result.totalUnits, 50);
  assert.equal(result.charges.brokerage, 40);
  assert.equal(result.grossPnL, 1000);
  assert.equal(result.netPnL, 960);
});

test("zero rates are preserved in all modes and net reconciles after rounding", () => {
  for (const brokerageMode of ["percentage", "flat_per_lot", "paisa_per_share", "flat_per_order"]) {
    assert.equal(calculateCharges({ ...equity, brokerageMode, brokeragePercent: 0 }).charges.brokerage, 0);
  }
  const result = calculateCharges({ ...equity, quantity: 1, entryPrice: 1.005, exitPrice: 1.02, brokeragePercent: 0.3 });
  assert.equal(result.netPnL, Number((result.grossPnL - result.charges.total).toFixed(2)));
});

test("invalid financial inputs fail instead of silently falling back", () => {
  for (const patch of [{ quantity: 0 }, { quantity: 1.5 }, { lotSize: -1 }, { entryPrice: -1 }, { brokeragePercent: -1 }, { brokeragePercent: Infinity }, { brokeragePercent: "bad" }, { brokeragePercent: 101 }, { brokerageMode: "unknown" }, { side: "other" }]) {
    assert.throws(() => calculateCharges({ ...equity, ...patch }), { name: "TradeInputError" });
  }
  assert.throws(() => calculateCharges({ ...equity, instrument: "OPTIDX", brokerageMode: "paisa_per_share" }), /equity/);
});

test("normalization persists inferred mode and derivative segment", () => {
  const result = normalizeTradeInput({ ...equity, brokerageMode: undefined, instrument: "OPTIDX", tradeMode: "nrml", segment: "options" });
  assert.equal(result.brokerageMode, "flat_per_lot");
  assert.equal(result.segment, "options");
  assert.equal(result.calculationVersion, 2);
});

test("PATCH preserves rate, mode, and sell timestamp, and can clear both exit aliases", () => {
  const existing = { ...equity, sellPrice: 300, brokerageMode: "paisa_per_share", brokeragePercent: 5, orderTimeline: { sellOrderTime: "2026-09-01T12:00:00Z" } };
  const edited = normalizeTradeInput({ stockName: "renamed", orderTimeline: { buyOrderTime: null } }, existing);
  assert.equal(edited.brokerageMode, "paisa_per_share");
  assert.equal(edited.brokeragePercent, 5);
  assert.equal(edited.orderTimeline.sellOrderTime.toISOString(), existing.orderTimeline.sellOrderTime.replace("Z", ".000Z"));
  const open = normalizeTradeInput({ sellPrice: null, status: "open" }, existing);
  assert.equal(open.exitPrice, null);
  assert.equal(open.sellPrice, null);
  assert.equal(calculateCharges(open).charges.brokerage, 0);
  assert.throws(() => normalizeTradeInput({ ...equity, status: "open" }), /LTP/);
});

test("short trades have actual buy/sell totals and leg statuses", () => {
  const trade = normalizeTradeInput({ ...equity, side: "sell", exitPrice: null });
  const result = calculateCharges(trade);
  assert.equal(result.totalBuy, 0);
  assert.equal(result.totalSell, 200000);
  assert.equal(trade.orderTimeline.buyOrderStatus, "OPEN");
  assert.equal(trade.orderTimeline.sellOrderStatus, "COMPLETE");
});

test("historical report never guesses a replacement rate or mutates the source", () => {
  const trade = { ...equity, _id: "legacy", brokeragePercent: 20, charges: { brokerage: 100000 }, netPnL: 0, status: "closed" };
  const before = JSON.stringify(trade);
  const preview = buildRecalculation(trade);
  assert.equal(preview.report.needsRateReview, true);
  assert.equal(preview.report.after.brokerage, 100000);
  assert.equal(buildRecalculation(trade, { brokeragePercent: 0.1 }).report.after.brokerage, 500);
  assert.equal(JSON.stringify(trade), before);
});
