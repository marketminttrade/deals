function finiteNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getTradeExitPrice(trade) {
  if (!trade) return null;
  const exitPrice = finiteNumber(trade.exitPrice);
  if (exitPrice !== null) return exitPrice;
  return finiteNumber(trade.sellPrice);
}

export function resolveTradeLifecycle(trade) {
  const status = String(trade?.status || "").trim().toLowerCase();
  const exitPrice = getTradeExitPrice(trade);
  const hasExitPrice = exitPrice !== null;

  // Explicit open status wins for compatibility with SS records where the
  // sell/exit alias stored Current LTP. A trade is realised only when it has
  // an exit and is not explicitly open.
  const isClosed = hasExitPrice && status !== "open";

  let consistencyIssue = null;
  if (status === "open" && hasExitPrice) consistencyIssue = "legacy_open_exit_alias";
  else if (status === "closed" && !hasExitPrice) consistencyIssue = "closed_without_exit";
  else if (status !== "open" && status !== "closed") consistencyIssue = "inferred_status";

  return {
    status,
    exitPrice,
    hasExitPrice,
    isClosed,
    isOpen: !isClosed,
    consistencyIssue,
  };
}

export function getTradeMarkPrice(trade) {
  const lifecycle = resolveTradeLifecycle(trade);
  if (!lifecycle.isOpen) return null;

  // New records explicitly preserve whether an LTP was entered. Undefined
  // remains compatible with historical records created before this flag.
  if (trade?.ltpProvided === false) return null;

  const ltp = finiteNumber(trade?.ltp);
  if (ltp !== null) return ltp;

  if (lifecycle.consistencyIssue === "legacy_open_exit_alias") {
    return lifecycle.exitPrice;
  }

  return null;
}

export function isTradeClosed(trade) {
  return resolveTradeLifecycle(trade).isClosed;
}

export function isTradeOpen(trade) {
  return resolveTradeLifecycle(trade).isOpen;
}

function isDerivativeOrCommodity(trade) {
  const instrument = String(trade?.instrument || "").toUpperCase();
  const segment = String(trade?.segment || "").toLowerCase();
  return ["OPTIDX", "FUTIDX", "FUTSTK"].includes(instrument) ||
    ["options", "futures", "commodity"].includes(segment);
}

export function getOpenTradeBucket(trade) {
  if (!isTradeOpen(trade)) return null;

  const tradeMode = String(trade?.tradeMode || "").toLowerCase();
  const segment = String(trade?.segment || "").toLowerCase();

  // Derivative/commodity and intraday evidence takes precedence over legacy
  // delivery aliases, making the two portfolio buckets mutually exclusive.
  if (isDerivativeOrCommodity(trade) || tradeMode === "mis" || segment === "intraday") {
    return "position";
  }

  if (tradeMode === "cnc" || tradeMode === "nrml" || segment === "delivery") {
    return "holding";
  }

  // Unknown open products remain visible instead of silently disappearing.
  return "position";
}

export function isOpenHolding(trade) {
  return getOpenTradeBucket(trade) === "holding";
}

export function isOpenPosition(trade) {
  return getOpenTradeBucket(trade) === "position";
}

