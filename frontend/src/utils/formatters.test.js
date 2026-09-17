import { computeTradePnL, summarizeTradePnL } from "./formatters";

describe("computeTradePnL", () => {
  const base = {
    status: "open",
    side: "buy",
    quantity: 10,
    lotSize: 1,
    entryPrice: 100,
    charges: { total: 25 },
  };

  test("reports open unrealised P&L gross without deducting brokerage", () => {
    const result = computeTradePnL({ ...base, ltp: 120, ltpProvided: true });
    expect(result.grossPnL).toBe(200);
    expect(result.netPnL).toBe(175);
    expect(result.unrealizedPnL).toBe(200);
    expect(result.pnl).toBe(200);
  });

  test("reports closed realised P&L from the stored net result", () => {
    const result = computeTradePnL({
      ...base,
      status: "closed",
      exitPrice: 120,
      grossPnL: 200,
      netPnL: 175,
    });
    expect(result.realizedPnL).toBe(175);
    expect(result.pnl).toBe(175);
  });

  test("returns an unavailable result when LTP was not supplied", () => {
    const result = computeTradePnL({ ...base, ltp: 100, ltpProvided: false });
    expect(result.hasMarketPrice).toBe(false);
    expect(result.unrealizedPnL).toBeNull();
    expect(result.pnl).toBeNull();
  });

  test("uses physical units and preserves short direction", () => {
    const result = computeTradePnL({ ...base, side: "sell", quantity: 2, lotSize: 25, ltp: 90, ltpProvided: true });
    expect(result.totalUnits).toBe(50);
    expect(result.unrealizedPnL).toBe(500);
  });

  test("keeps aggregate P&L unavailable while any open trade lacks LTP", () => {
    const summary = summarizeTradePnL([
      { ...base, ltp: 120, ltpProvided: true },
      { ...base, status: "closed", exitPrice: 110, grossPnL: 100, netPnL: 75 },
      { ...base, ltp: 100, ltpProvided: false },
    ]);

    expect(summary.realizedPnL).toBe(75);
    expect(summary.knownUnrealizedPnL).toBe(200);
    expect(summary.unrealizedPnL).toBeNull();
    expect(summary.totalPnL).toBeNull();
    expect(summary.missingLtpCount).toBe(1);
  });
});
