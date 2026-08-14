import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { brokerApi } from "../../api/client";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { computeTradePnL, formatCurrency, formatDate } from "../../utils/formatters";

// ── Icons ─────────────────────────────────────────────────
const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const EyeIcon = ({ hidden }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {hidden ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.45 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const MoreVerticalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

// ── SVG Sparkline Component ───────────────────────────────
function Sparkline({ positive = true }) {
  const points = positive
    ? "0,22 12,18 24,20 36,12 48,14 60,6 72,4"
    : "0,6 12,10 24,8 36,18 48,16 60,24 72,26";

  return (
    <svg viewBox="0 0 72 30" preserveAspectRatio="none" style={{ width: 64, height: 24, display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "var(--bp-green)" : "var(--bp-red)"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Holding Card ──────────────────────────────────────────
function HoldingCard({ trade, hideValues, onClick }) {
  const pnlObj = computeTradePnL(trade);
  const pnl = pnlObj.pnl;
  const isProfit = pnlObj.isProfit;

  const avgPrice = Number(trade.buyPrice ?? trade.entryPrice ?? 0);
  const ltp = Number(trade.ltp ?? trade.sellPrice ?? trade.exitPrice ?? avgPrice);
  const qty = Number(trade.quantity || 1);
  const lotSize = Number(trade.lotSize || 1);
  const totalUnits = qty * lotSize;
  const invested = avgPrice * totalUnits;
  const marketVal = ltp * totalUnits;
  const pctChange = invested > 0 ? (((marketVal - invested) / invested) * 100).toFixed(2) : "0.00";
  const exchangeTag = trade.instrument === "EQUITY" ? "NSE" : (trade.segment === "commodity" ? "MCX" : "NFO");

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bp-surface)",
        border: "1px solid var(--bp-border)",
        borderRadius: "var(--bp-radius-lg)",
        padding: "16px",
        boxShadow: "var(--bp-shadow)",
        cursor: "pointer",
      }}
    >
      {/* Top Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
              {trade.symbol || trade.stockName}
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                background: "var(--bp-blue-soft)",
                color: "var(--bp-blue)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {exchangeTag}
            </span>
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--bp-muted)", display: "block", marginTop: 3 }}>
            Qty. {qty} {lotSize > 1 ? `(${totalUnits} Units)` : ""} · Avg. {avgPrice.toFixed(2)}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <Sparkline positive={isProfit} />
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                background: isProfit ? "var(--bp-green-soft)" : "var(--bp-red-soft)",
                color: isProfit ? "var(--bp-green)" : "var(--bp-red)",
              }}
            >
              {isProfit ? "+" : ""}{pctChange}%
            </span>
          </div>
          <button type="button" className="bp-icon-btn" style={{ width: 28, height: 28, border: "none", background: "transparent", color: "var(--bp-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MoreVerticalIcon />
          </button>
        </div>
      </div>

      {/* Middle & Bottom Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 10, borderTop: "1px solid var(--bp-border)" }}>
        <div>
          <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>Invested</span>
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 2 }}>
            {hideValues ? "••••••" : formatCurrency(invested)}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>Market Value</span>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 2 }}>
            {hideValues ? "••••••" : formatCurrency(marketVal)}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div>
          <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>LTP</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 2 }}>
            {formatCurrency(ltp)}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>P&L</span>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, fontFamily: "Inter, sans-serif", display: "block", marginTop: 2, color: isProfit ? "var(--bp-green)" : "var(--bp-red)" }}>
            {hideValues ? "••••••" : `${isProfit ? "+" : ""}${formatCurrency(pnl)}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Position Card ────────────────────────────────────────
function PositionItem({ trade, onClick }) {
  const pnlObj = computeTradePnL(trade);
  const pnl = pnlObj.pnl;
  const isProfit = pnlObj.isProfit;

  const buyPrice = Number(trade.buyPrice ?? trade.entryPrice ?? 0);
  const sellPrice = trade.sellPrice ?? trade.exitPrice;
  const hasSell = sellPrice !== null && sellPrice !== undefined && sellPrice !== "";
  const ltp = Number(trade.ltp ?? buyPrice);

  const exchangeTag = trade.instrument === "EQUITY" ? "NSE" : (trade.segment === "commodity" ? "MCX" : "NFO");
  const tradeModeText = (trade.tradeMode || "mis").toUpperCase();

  return (
    <div
      className="bp-position-item"
      onClick={onClick}
      id={`bp-trade-${trade._id}`}
    >
      {/* Row 1 */}
      <div className="bp-position-row bp-position-row--1">
        <span>Qty. {trade.status === "closed" ? 0 : trade.quantity}</span>
        <span>Sell Avg. {hasSell ? Number(sellPrice).toFixed(2) : "–"}</span>
        <span className="bp-order-mode-tag">{tradeModeText}</span>
      </div>

      {/* Row 2 */}
      <div className="bp-position-row bp-position-row--2">
        <span className="bp-position-symbol">{trade.symbol || trade.stockName}</span>
        <span className={`bp-position-pnl ${isProfit ? "is-green" : "is-red"}`}>
          {isProfit ? "+" : ""}{formatCurrency(pnl)}
        </span>
      </div>

      {/* Row 3 */}
      <div className="bp-position-row bp-position-row--3">
        <span>{exchangeTag}</span>
        <span>Buy Avg. {Number(buyPrice).toFixed(2)}</span>
        <span>LTP {Number(ltp).toFixed(2)}</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function BrokerHoldingsPage() {
  const navigate = useNavigate();
  const { selectedClient } = useBrokerAuth();

  const [activeTab, setActiveTab] = useState("holdings");
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hideValues, setHideValues] = useState(false);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const res = await brokerApi.get("/api/broker-portal/trades");
      setTrades(res.data?.trades || res.data || []);
      setLastUpdated(new Date());
    } catch {
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrades(); }, []);

  const clientTrades = useMemo(() => {
    if (!selectedClient) return trades;
    return trades.filter((t) => t.clientId?._id === selectedClient._id || t.clientId === selectedClient._id);
  }, [trades, selectedClient]);

  // Holdings are CNC / NRML / Delivery orders
  const holdings = useMemo(() => {
    return clientTrades.filter((t) => t.tradeMode === "cnc" || t.tradeMode === "nrml" || t.segment === "delivery");
  }, [clientTrades]);

  // Positions are MIS / Intraday orders
  const positions = useMemo(() => {
    return clientTrades.filter((t) => t.tradeMode === "mis" || t.segment === "intraday");
  }, [clientTrades]);

  // Step 1: Context-aware trade lists based on active tab
  const activeTrades = useMemo(() => {
    return activeTab === "holdings" ? holdings : positions;
  }, [activeTab, holdings, positions]);

  // Step 2: Separate Open vs Closed trades to prevent closed trades from inflating capital metrics
  const openTrades = useMemo(() => activeTrades.filter(t => t.status === "open"), [activeTrades]);
  const closedTrades = useMemo(() => activeTrades.filter(t => t.status === "closed"), [activeTrades]);

  // Step 3: Calculate accurate financials using open trades for capital metrics
  const investedTotal = useMemo(() =>
    openTrades.reduce((s, t) => s + (Number(t.quantity || 1) * Number(t.lotSize || 1) * Number(t.buyPrice ?? t.entryPrice ?? 0)), 0),
    [openTrades]
  );

  const marketValTotal = useMemo(() =>
    openTrades.reduce((s, t) => {
      const units = Number(t.quantity || 1) * Number(t.lotSize || 1);
      const buyP = Number(t.buyPrice ?? t.entryPrice ?? 0);
      const ltpP = Number(t.ltp ?? t.sellPrice ?? t.exitPrice ?? buyP);
      return s + (units * ltpP);
    }, 0),
    [openTrades]
  );

  // Profit & Loss Metrics (Net P&L - Brokerage Deducted)
  const unrealisedPnL = useMemo(() =>
    openTrades.reduce((s, t) => s + computeTradePnL(t).netPnL, 0),
    [openTrades]
  );

  const realisedPnL = useMemo(() =>
    closedTrades.reduce((s, t) => s + computeTradePnL(t).netPnL, 0),
    [closedTrades]
  );

  const totalPnL = realisedPnL + unrealisedPnL;
  const totalPnLPct = investedTotal > 0 ? ((totalPnL / investedTotal) * 100).toFixed(2) : "0.00";

  return (
    <div style={{ background: "var(--bp-bg)", minHeight: "100vh", paddingBottom: 80 }}>
      {/* ── Sticky Top Header ── */}
      <div className="bp-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bp-blue-soft)", color: "var(--bp-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BriefcaseIcon />
          </div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
            Portfolio
          </h1>
        </div>
      </div>

      {/* ── Tabs (Holdings / Positions) ── */}
      <div className="bp-tab-row">
        <button
          type="button"
          className={`bp-tab-btn${activeTab === "holdings" ? " is-active" : ""}`}
          onClick={() => setActiveTab("holdings")}
          id="bp-tab-holdings"
        >
          Holdings ({holdings.length})
        </button>
        <button
          type="button"
          className={`bp-tab-btn${activeTab === "positions" ? " is-active" : ""}`}
          onClick={() => setActiveTab("positions")}
          id="bp-tab-positions"
        >
          Positions ({positions.length})
        </button>
      </div>

      {loading && <div className="bp-loading"><div className="bp-spinner" /></div>}

      {/* ── Always-Visible Portfolio Summary Card (Both Holdings & Positions) ── */}
      {!loading && (
        <div style={{ margin: "12px 12px 0", background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", padding: "18px 16px 14px", boxShadow: "var(--bp-shadow)" }}>
          <div style={{ textAlign: "center", paddingBottom: 14, borderBottom: "1px solid var(--bp-border)" }}>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--bp-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              Total Net Return
              <button type="button" onClick={() => setHideValues((v) => !v)} style={{ background: "transparent", border: "none", color: "var(--bp-blue)", cursor: "pointer", padding: 0 }}>
                <EyeIcon hidden={hideValues} />
              </button>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "1.75rem", fontWeight: 700, fontFamily: "Inter, sans-serif", color: totalPnL >= 0 ? "var(--bp-green)" : "var(--bp-red)" }}>
              {hideValues ? "••••••••" : `${totalPnL >= 0 ? "+" : ""}${formatCurrency(totalPnL)}`}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--bp-muted)" }}>
              <span className={totalPnL >= 0 ? "bp-profit" : "bp-loss"} style={{ fontWeight: 700 }}>
                {hideValues ? "••••" : `(${totalPnL >= 0 ? "+" : ""}${totalPnLPct}%)`}
              </span>
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 14 }}>
            <div style={{ textAlign: "center", padding: "6px", background: "var(--bp-bg)", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--bp-muted)", display: "block" }}>Invested Value</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: "Inter, sans-serif", display: "block", marginTop: 3, color: "var(--bp-text)" }}>
                {hideValues ? "••••••" : formatCurrency(investedTotal)}
              </span>
            </div>
            <div style={{ textAlign: "center", padding: "6px", background: "var(--bp-bg)", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--bp-muted)", display: "block" }}>Market Value</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: "Inter, sans-serif", display: "block", marginTop: 3, color: "var(--bp-text)" }}>
                {hideValues ? "••••••" : formatCurrency(marketValTotal)}
              </span>
            </div>
            <div style={{ textAlign: "center", padding: "6px", background: "var(--bp-bg)", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--bp-muted)", display: "block" }}>Realised P&L</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: "Inter, sans-serif", display: "block", marginTop: 3, color: realisedPnL >= 0 ? "var(--bp-green)" : "var(--bp-red)" }}>
                {hideValues ? "••••••" : `${realisedPnL >= 0 ? "+" : ""}${formatCurrency(realisedPnL)}`}
              </span>
            </div>
            <div style={{ textAlign: "center", padding: "6px", background: "var(--bp-bg)", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--bp-muted)", display: "block" }}>Unrealised P&L</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: "Inter, sans-serif", display: "block", marginTop: 3, color: unrealisedPnL >= 0 ? "var(--bp-green)" : "var(--bp-red)" }}>
                {hideValues ? "••••••" : `${unrealisedPnL >= 0 ? "+" : ""}${formatCurrency(unrealisedPnL)}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══ HOLDINGS TAB ══ */}
      {!loading && activeTab === "holdings" && (
        <>
          {/* Action Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 16px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--bp-muted)" }}>
              <SearchIcon />
              <FilterIcon />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--bp-muted)" }}>
              <span>View by</span>
              <select style={{ border: "none", background: "transparent", color: "var(--bp-blue)", fontWeight: 600, fontSize: "0.82rem", outline: "none", cursor: "pointer" }}>
                <option value="product">Product</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Holdings Cards List */}
          {holdings.length > 0 ? (
            <div style={{ margin: "0 12px", display: "grid", gap: 10 }}>
              {holdings.map((t) => <HoldingCard key={t._id} trade={t} hideValues={hideValues} onClick={() => navigate(`/account/trades/${t._id}`)} />)}
            </div>
          ) : (
            <div className="bp-empty" style={{ margin: "12px" }}>
              <BriefcaseIcon />
              <p>No CNC holdings recorded for this account</p>
            </div>
          )}

          {/* Footer Note */}
          <div style={{ margin: "14px 12px 0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius)", fontSize: "0.78rem", color: "var(--bp-muted)", boxShadow: "var(--bp-shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ClockIcon />
              <span>Holdings updated on: {lastUpdated ? formatDate(lastUpdated) : "28 Nov 2024, 10:45 AM"}</span>
            </div>
            <button type="button" onClick={loadTrades} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: "var(--bp-blue)", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
              <RefreshIcon /> Refresh
            </button>
          </div>
        </>
      )}

      {/* ══ POSITIONS TAB ══ */}
      {!loading && activeTab === "positions" && (
        <div style={{ margin: "12px 0" }}>
          {positions.length > 0 ? (
            <div className="bp-position-list">
              {positions.map((t) => <PositionItem key={t._id} trade={t} onClick={() => navigate(`/account/trades/${t._id}`)} />)}
            </div>
          ) : (
            <div className="bp-empty">
              <p>No MIS / open positions recorded</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
