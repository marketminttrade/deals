export function getInvoiceExchangeLabels(trades = []) {
  const exchanges = [...new Set(trades.map((trade) => trade.exchange).filter(Boolean))].sort();
  return {
    exchangeLabel: exchanges.join(", ") || "—",
    chargeExchangeLabel: exchanges.length > 1 ? "Multiple" : exchanges[0] || "—",
  };
}
