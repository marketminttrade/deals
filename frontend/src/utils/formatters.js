import { getTradeMarkPrice, resolveTradeLifecycle } from "./tradeClassification";

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatAmount(value) {
  const amount = Number(value ?? 0);
  const normalizedAmount = Number.isNaN(amount) || Math.abs(amount) < 0.005 ? 0 : amount;

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizedAmount);
}

export function formatRupee(value) {
  const amount = Number(value ?? 0);
  const normalizedAmount = Number.isNaN(amount) || Math.abs(amount) < 0.005 ? 0 : amount;
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(normalizedAmount));

  return `${normalizedAmount < 0 ? "-" : ""}\u20B9${formattedAmount}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function maskPhoneNumber(value) {
  const phone = String(value ?? "").trim();

  if (!phone) {
    return "-";
  }

  const digitCount = (phone.match(/\d/g) || []).length;
  if (digitCount <= 6) {
    return phone;
  }

  let digitIndex = 0;
  return phone.replace(/\d/g, (digit) => {
    digitIndex += 1;

    if (digitIndex <= 3 || digitIndex > digitCount - 3) {
      return digit;
    }

    return "X";
  });
}

export function initialsFromName(value) {
  if (!value) {
    return "BR";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function titleCase(value) {
  if (!value) {
    return "-";
  }

  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function computeTradePnL(trade) {
  if (!trade) {
    return {
      grossPnL: null,
      netPnL: null,
      pnl: null,
      unrealizedPnL: null,
      realizedPnL: null,
      chargesTotal: 0,
      totalUnits: 0,
      hasMarketPrice: false,
      isClosed: false,
      isOpen: true,
      isProfit: null,
    };
  }

  const side = String(trade.side || "buy").toLowerCase();
  const rawQty = Number(trade.quantity || 1);
  const lotSize = Number(trade.lotSize || 1);
  const totalUnits = rawQty * lotSize;

  const buyPrice = Number(trade.buyPrice ?? trade.entryPrice ?? 0);
  const lifecycle = resolveTradeLifecycle(trade);
  const markPrice = lifecycle.isOpen ? getTradeMarkPrice(trade) : lifecycle.exitPrice;
  const hasMarketPrice = markPrice !== null && Number.isFinite(markPrice);
  const chargesTotal = Number(trade.charges?.total ?? trade.charges?.brokerage ?? 0);

  let grossPnL = null;
  if (hasMarketPrice) {
    grossPnL = side === "buy"
      ? (markPrice - buyPrice) * totalUnits
      : (buyPrice - markPrice) * totalUnits;
  }

  // Closed statements use the stored financial result, including historical records.
  if (lifecycle.isClosed && trade.grossPnL != null) grossPnL = Number(trade.grossPnL);
  if (grossPnL !== null) grossPnL = Number(grossPnL.toFixed(2));

  let netPnL = grossPnL === null ? null : grossPnL - chargesTotal;
  if (lifecycle.isClosed && trade.netPnL != null) netPnL = Number(trade.netPnL);
  if (netPnL !== null) netPnL = Number(netPnL.toFixed(2));

  // Product contract: open P&L is gross mark-to-market; closed P&L is net
  // realised P&L after charges. Gross and net remain available separately.
  const pnl = lifecycle.isClosed ? netPnL : grossPnL;

  return {
    grossPnL,
    netPnL,
    pnl,
    unrealizedPnL: lifecycle.isOpen ? grossPnL : null,
    realizedPnL: lifecycle.isClosed ? netPnL : null,
    chargesTotal: Number(chargesTotal.toFixed(2)),
    totalUnits,
    markPrice,
    hasMarketPrice,
    isClosed: lifecycle.isClosed,
    isOpen: lifecycle.isOpen,
    consistencyIssue: lifecycle.consistencyIssue,
    isProfit: pnl === null ? null : pnl >= 0,
  };
}

export function summarizeTradePnL(trades = []) {
  let realizedPnL = 0;
  let knownUnrealizedPnL = 0;
  let missingLtpCount = 0;

  trades.forEach((trade) => {
    const metric = computeTradePnL(trade);
    if (metric.isClosed) {
      realizedPnL += metric.realizedPnL ?? 0;
    } else if (metric.hasMarketPrice) {
      knownUnrealizedPnL += metric.unrealizedPnL ?? 0;
    } else {
      missingLtpCount += 1;
    }
  });

  realizedPnL = Number(realizedPnL.toFixed(2));
  knownUnrealizedPnL = Number(knownUnrealizedPnL.toFixed(2));
  const unrealizedPnL = missingLtpCount > 0 ? null : knownUnrealizedPnL;

  return {
    realizedPnL,
    knownUnrealizedPnL,
    unrealizedPnL,
    totalPnL: unrealizedPnL === null ? null : Number((realizedPnL + unrealizedPnL).toFixed(2)),
    missingLtpCount,
  };
}
