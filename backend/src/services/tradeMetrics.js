function roundCurrency(value) {
  return Number((value || 0).toFixed(2));
}

/**
 * Calculate trade charges, turnover, and P&L.
 *
 * Unit Rules:
 *  - quantity = Shares for Equity; Number of Lots for Derivatives (Futures/Options/Commodity)
 *  - lotSize = Units per lot (1 for Equity, e.g. 25/50/100 for Derivatives)
 *  - totalUnits = quantity * lotSize
 *
 * Brokerage modes:
 *  - "flat_per_lot" → brokerage = rate * quantity (number of lots)
 *  - "percentage"   → brokerage = turnover * (rate / 100)
 */
function calculateCharges(tradeInput) {
  const quantity = Number(tradeInput.quantity || 0);          // Shares or Lots
  const lotSize = Number(tradeInput.lotSize || 1);            // Units per lot
  const totalUnits = quantity * (lotSize > 0 ? lotSize : 1);  // Physical units traded

  const entryPrice = Number(tradeInput.entryPrice ?? tradeInput.buyPrice ?? 0);
  const exitValue = tradeInput.exitPrice ?? tradeInput.sellPrice;
  const hasExitPrice = exitValue !== "" && exitValue !== null && exitValue !== undefined;
  const exitPrice = Number(hasExitPrice ? exitValue : 0);

  // Total Turnover in INR based on physical units
  const turnover = totalUnits * (entryPrice + (exitPrice || 0));
  const rate = Number(tradeInput.brokeragePercent || 0);

  // Determine brokerage mode
  const brokerageMode = tradeInput.brokerageMode;
  const isFlat =
    brokerageMode === "flat_per_lot" ||
    (!brokerageMode && (tradeInput.segment === "options" || tradeInput.segment === "futures" || tradeInput.segment === "commodity")) ||
    (!brokerageMode && (tradeInput.instrument === "OPTIDX" || tradeInput.instrument === "FUTIDX" || tradeInput.instrument === "FUTSTK"));

  let brokerage = 0;
  if (isFlat) {
    // Flat rate per lot: ₹Rate * quantity (lots)
    brokerage = rate * quantity;
  } else {
    // Percentage rate: % of turnover
    brokerage = turnover * (rate / 100);
  }

  const gst = 0;
  const exchangeFee = 0;
  const sebiFee = 0;
  const stampDuty = 0;
  const totalCharges = brokerage + gst + exchangeFee + sebiFee + stampDuty;

  let grossPnL = 0;
  if (hasExitPrice) {
    grossPnL =
      tradeInput.side === "buy"
        ? (exitPrice - entryPrice) * totalUnits
        : (entryPrice - exitPrice) * totalUnits;
  } else {
    const ltpPrice = Number(tradeInput.ltp ?? entryPrice ?? 0);
    grossPnL =
      tradeInput.side === "buy"
        ? (ltpPrice - entryPrice) * totalUnits
        : (entryPrice - ltpPrice) * totalUnits;
  }

  const netPnL = grossPnL - totalCharges;

  return {
    totalUnits,
    turnover: roundCurrency(turnover),
    charges: {
      brokerage: roundCurrency(brokerage),
      gst: roundCurrency(gst),
      exchangeFee: roundCurrency(exchangeFee),
      sebiFee: roundCurrency(sebiFee),
      stampDuty: roundCurrency(stampDuty),
      total: roundCurrency(totalCharges),
    },
    grossPnL: roundCurrency(grossPnL),
    netPnL: roundCurrency(netPnL),
  };
}

module.exports = { calculateCharges, roundCurrency };
