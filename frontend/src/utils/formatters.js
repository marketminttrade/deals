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
  if (!trade) return { grossPnL: 0, netPnL: 0, pnl: 0, chargesTotal: 0, totalUnits: 0, isProfit: true };

  const side = String(trade.side || "buy").toLowerCase();
  const rawQty = Number(trade.quantity || 1);
  const lotSize = Number(trade.lotSize || 1);
  const totalUnits = rawQty * lotSize;

  const buyPrice = Number(trade.buyPrice ?? trade.entryPrice ?? 0);
  const sellPrice = trade.sellPrice ?? trade.exitPrice;
  const hasSell = sellPrice !== null && sellPrice !== undefined && sellPrice !== "";
  
  // Resolve LTP: if ltp is missing, empty or 0, fallback to buyPrice for open trades
  let ltp = trade.ltp !== undefined && trade.ltp !== null && trade.ltp !== "" ? Number(trade.ltp) : buyPrice;
  if (Number.isNaN(ltp)) {
    ltp = buyPrice;
  }

  const chargesTotal = Number(trade.charges?.total || 0);

  let grossPnL = 0;
  if (hasSell) {
    const exitP = Number(sellPrice);
    grossPnL = side === "buy" ? (exitP - buyPrice) * totalUnits : (buyPrice - exitP) * totalUnits;
  } else {
    grossPnL = side === "buy" ? (ltp - buyPrice) * totalUnits : (buyPrice - ltp) * totalUnits;
  }

  const netPnL = grossPnL - chargesTotal;

  return {
    grossPnL: Number(grossPnL.toFixed(2)),
    netPnL: Number(netPnL.toFixed(2)),
    pnl: Number(grossPnL.toFixed(2)),
    chargesTotal: Number(chargesTotal.toFixed(2)),
    totalUnits,
    isProfit: grossPnL >= 0,
  };
}
