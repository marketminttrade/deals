const { invalid, validateFinancialInput } = require("./tradeInput");

function roundCurrency(value) {
  return Number((value || 0).toFixed(2));
}

// quantity is shares for equity and lots for derivatives. LTP never creates turnover.
function calculateCharges(tradeInput) {
  const input = validateFinancialInput(tradeInput);
  const { quantity, lotSize, entryPrice, exitPrice, ltp, side, brokerageMode } = input;
  const totalUnits = quantity * lotSize;
  const hasExitPrice = exitPrice !== undefined;
  const entryValue = totalUnits * entryPrice;
  const exitValue = totalUnits * (exitPrice ?? 0);
  const turnover = entryValue + exitValue;
  const rate = input.brokeragePercent;
  let brokerage;
  switch (brokerageMode) {
    case "flat_per_lot": brokerage = rate * quantity; break;
    case "flat_per_order": brokerage = rate * (hasExitPrice ? 2 : 1); break;
    case "paisa_per_share": brokerage = side === "sell" || hasExitPrice ? totalUnits * rate / 100 : 0; break;
    default: brokerage = turnover * rate / 100;
  }
  const gross = ((hasExitPrice ? exitPrice : ltp) - entryPrice) * totalUnits * (side === "buy" ? 1 : -1);
  if ([turnover, brokerage, gross].some((amount) => !Number.isFinite(amount) || Math.abs(amount) > Number.MAX_SAFE_INTEGER / 100)) {
    invalid("Trade amounts exceed the supported currency range.");
  }
  brokerage = roundCurrency(brokerage);
  const grossPnL = roundCurrency(gross);
  return {
    totalUnits,
    totalBuy: roundCurrency(side === "buy" ? entryValue : exitValue),
    totalSell: roundCurrency(side === "sell" ? entryValue : exitValue),
    turnover: roundCurrency(turnover),
    charges: { brokerage, gst: 0, exchangeFee: 0, sebiFee: 0, stampDuty: 0, total: brokerage },
    grossPnL,
    netPnL: roundCurrency(grossPnL - brokerage),
  };
}

module.exports = { calculateCharges, roundCurrency };
