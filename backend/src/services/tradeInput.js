const BROKERAGE_MODES = ["percentage", "flat_per_lot", "paisa_per_share", "flat_per_order"];
const CALCULATION_VERSION = 2;

function invalid(message) {
  const error = new Error(message);
  error.name = "TradeInputError";
  throw error;
}

function numberValue(value, label, fallback, minimum = 0, integer = false) {
  const missing = value === undefined || value === null || String(value).trim() === "";
  const number = missing ? fallback : Number(value);
  if (!Number.isFinite(number) || number < minimum || (integer && !Number.isSafeInteger(number))) {
    invalid(`${label} must be ${integer ? "a whole number" : "a finite number"} of at least ${minimum}.`);
  }
  return number;
}

function resolveBrokerageMode(input) {
  if (input.brokerageMode) return input.brokerageMode;
  return ["options", "futures", "commodity"].includes(input.segment) ||
    ["OPTIDX", "FUTIDX", "FUTSTK"].includes(input.instrument)
    ? "flat_per_lot" : "percentage";
}

function validateFinancialInput(input) {
  const quantity = numberValue(input.quantity, "Quantity", undefined, 1, true);
  const lotSize = numberValue(input.lotSize, "Lot size", 1, 1, true);
  if (!Number.isSafeInteger(quantity * lotSize)) invalid("Total units are too large.");
  const entryPrice = numberValue(input.entryPrice ?? input.buyPrice, "Entry price", undefined);
  const exitValue = input.exitPrice !== undefined ? input.exitPrice : input.sellPrice;
  const hasExitPrice = exitValue !== undefined && exitValue !== null && String(exitValue).trim() !== "";
  const exitPrice = hasExitPrice ? numberValue(exitValue, "Exit price") : undefined;
  const ltp = numberValue(input.ltp, "LTP", exitPrice ?? entryPrice);
  const brokeragePercent = numberValue(input.brokeragePercent, "Brokerage rate", 0);
  const brokerageMode = resolveBrokerageMode(input);
  if (!BROKERAGE_MODES.includes(brokerageMode)) invalid("Select a supported brokerage mode.");
  if (brokerageMode === "percentage" && brokeragePercent > 100) invalid("Brokerage percentage cannot exceed 100.");
  const derivative = ["options", "futures", "commodity"].includes(input.segment) ||
    ["OPTIDX", "FUTIDX", "FUTSTK"].includes(input.instrument);
  if (brokerageMode === "paisa_per_share" && (derivative || lotSize !== 1)) {
    invalid("Paisa per share brokerage is available for equity shares only.");
  }
  const side = input.side || "buy";
  if (!["buy", "sell"].includes(side)) invalid("Side must be buy or sell.");
  return { quantity, lotSize, entryPrice, exitPrice, ltp, brokeragePercent, brokerageMode, side };
}

function dateValue(value, label) {
  if (value === null || value === "" || value === undefined) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) invalid(`${label} is invalid.`);
  return date;
}

// Merge aliases explicitly so PATCH can clear an exit and does not revive an old alias.
function normalizeTradeInput(input, existing = {}) {
  const merged = { ...existing, ...input };
  merged.entryPrice = input.entryPrice !== undefined ? input.entryPrice
    : input.buyPrice !== undefined ? input.buyPrice : existing.entryPrice ?? existing.buyPrice;
  merged.exitPrice = input.exitPrice !== undefined ? input.exitPrice
    : input.sellPrice !== undefined ? input.sellPrice : existing.exitPrice ?? existing.sellPrice;
  const instrument = String(merged.instrument || (merged.segment === "options" ? "OPTIDX"
    : ["futures", "commodity"].includes(merged.segment) ? "FUTIDX" : "EQUITY")).toUpperCase();
  const tradeMode = String(merged.tradeMode || (merged.segment === "delivery" ? "cnc" : "mis")).toLowerCase();
  const segment = merged.segment === "commodity" ? "commodity" : instrument === "OPTIDX" ? "options"
    : ["FUTIDX", "FUTSTK"].includes(instrument) ? "futures" : tradeMode === "mis" ? "intraday" : "delivery";
  const financial = validateFinancialInput({ ...merged, instrument, segment });
  const closed = financial.exitPrice !== undefined;
  if (input.status && input.status !== (closed ? "closed" : "open")) {
    invalid("Closed trades require an exit price; open trades must use LTP instead of an exit price.");
  }
  const stockName = String(input.stockName ?? input.symbol ?? existing.stockName ?? existing.symbol ?? "").trim().toUpperCase();
  if (!stockName) invalid("Stock or symbol name is required.");
  const timeline = { ...(existing.orderTimeline || {}), ...(input.orderTimeline || {}) };
  const buyExecuted = financial.side === "buy" || closed;
  const sellExecuted = financial.side === "sell" || closed;
  return {
    clientId: merged.clientId,
    symbol: stockName, stockName, instrument, tradeMode, segment,
    ...financial,
    buyPrice: financial.entryPrice,
    sellPrice: financial.exitPrice ?? null,
    exitPrice: financial.exitPrice ?? null,
    strikePrice: merged.strikePrice == null || merged.strikePrice === "" ? null : numberValue(merged.strikePrice, "Strike price"),
    expiryDate: dateValue(merged.expiryDate, "Expiry date"),
    optionType: String(merged.optionType || "").toUpperCase(),
    ltpColor: merged.ltpColor === "red" ? "red" : "green",
    status: closed ? "closed" : "open",
    tradedAt: dateValue(merged.tradedAt ?? new Date(), "Trade date"),
    orderTimeline: {
      buyOrderTime: dateValue(timeline.buyOrderTime, "Buy order time"),
      sellOrderTime: dateValue(timeline.sellOrderTime, "Sell order time"),
      buyOrderStatus: buyExecuted ? "COMPLETE" : "OPEN",
      sellOrderStatus: sellExecuted ? "COMPLETE" : "OPEN",
    },
    calculationVersion: CALCULATION_VERSION,
  };
}

module.exports = { BROKERAGE_MODES, CALCULATION_VERSION, invalid, resolveBrokerageMode, validateFinancialInput, normalizeTradeInput };
