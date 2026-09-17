import {
  getOpenTradeBucket,
  getTradeMarkPrice,
  isOpenHolding,
  isOpenPosition,
  resolveTradeLifecycle,
} from "./tradeClassification";

describe("trade lifecycle and portfolio classification", () => {
  test.each([
    ["open CNC equity", { status: "open", instrument: "EQUITY", tradeMode: "cnc", segment: "delivery" }, true, "holding"],
    ["closed CNC equity", { status: "closed", exitPrice: 120, instrument: "EQUITY", tradeMode: "cnc", segment: "delivery" }, false, null],
    ["open MIS equity", { status: "open", instrument: "EQUITY", tradeMode: "mis", segment: "intraday" }, true, "position"],
    ["open NRML option", { status: "open", instrument: "OPTIDX", tradeMode: "nrml", segment: "options" }, true, "position"],
    ["legacy NRML equity", { status: "open", instrument: "EQUITY", tradeMode: "nrml", segment: "delivery" }, true, "holding"],
    ["contradictory CNC intraday", { status: "open", instrument: "EQUITY", tradeMode: "cnc", segment: "intraday" }, true, "position"],
    ["unknown open product", { status: "open" }, true, "position"],
  ])("classifies %s", (_name, trade, open, bucket) => {
    expect(resolveTradeLifecycle(trade).isOpen).toBe(open);
    expect(getOpenTradeBucket(trade)).toBe(bucket);
    expect(isOpenHolding(trade) && isOpenPosition(trade)).toBe(false);
  });

  test("keeps an SS-style open exit alias unrealised and uses it as the mark", () => {
    const trade = { status: "open", sellPrice: 125 };
    const lifecycle = resolveTradeLifecycle(trade);
    expect(lifecycle.isOpen).toBe(true);
    expect(lifecycle.consistencyIssue).toBe("legacy_open_exit_alias");
    expect(getTradeMarkPrice(trade)).toBe(125);
  });

  test("requires a valid exit before an explicitly closed trade is realised", () => {
    const lifecycle = resolveTradeLifecycle({ status: "closed", exitPrice: "" });
    expect(lifecycle.isOpen).toBe(true);
    expect(lifecycle.consistencyIssue).toBe("closed_without_exit");
  });

  test("infers lifecycle when historical status is missing and accepts zero exit", () => {
    expect(resolveTradeLifecycle({ exitPrice: 0 }).isClosed).toBe(true);
    expect(resolveTradeLifecycle({}).isOpen).toBe(true);
  });

  test("does not invent a mark when a new record says LTP was omitted", () => {
    expect(getTradeMarkPrice({ status: "open", ltp: 100, ltpProvided: false })).toBeNull();
    expect(getTradeMarkPrice({ status: "open", ltp: 0, ltpProvided: true })).toBe(0);
  });
});
