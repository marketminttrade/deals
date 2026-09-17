import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { brokerApi } from "../../api/client";
import { ACCOUNT_ROUTES } from "../../constants/accessConfig";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { computeTradePnL, formatCurrency, formatDate, summarizeTradePnL } from "../../utils/formatters";

const TRADE_CAPTURE_WIDTH = 500;

// ── Helpers ───────────────────────────────────────────────
function tradeModeLabel(m) {
  return m === "mis" ? "MIS" : m === "nrml" ? "NRML" : "CNC";
}

function formatSignedPnl(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  const amount = Number(value);
  return `${amount >= 0 ? "+" : ""}${formatCurrency(amount)}`;
}

// ── Icons ─────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Detail Icons
const BagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
);
const GridDotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="5" cy="19" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="5" r="1"/></svg>
);
const WaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const UpArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bp-green)" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
);
const DownArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bp-red)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
);
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);
const UpDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
);

// ── Edit Order Time Modal Component ─────────────────────────
function EditOrderTimeModal({ type, currentTime, onClose, onSave }) {
  const formatForInput = (val) => {
    const d = val ? new Date(val) : new Date();
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [inputVal, setInputVal] = useState(formatForInput(currentTime));
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(new Date(inputVal).toISOString());
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div className="bp-drawer-overlay" onClick={onClose} style={{ zIndex: 999 }} />
      <div className="bp-modal-dialog" style={{ zIndex: 1000 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "0.98rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
          Edit {type === "buy" ? "Buy Order" : "Sell Order"} Time
        </h3>
        <form onSubmit={handleSave}>
          <label style={{ fontSize: "0.76rem", color: "var(--bp-muted)", display: "block", marginBottom: 6 }}>
            Select Order Execution Date & Time:
          </label>
          <input
            type="datetime-local"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            required
            style={{
              width: "100%",
              height: 42,
              padding: "0 10px",
              borderRadius: 8,
              border: "1px solid var(--bp-border)",
              fontSize: "1rem",
              fontFamily: "Inter, sans-serif",
              marginBottom: 16,
              boxSizing: "border-box"
            }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="bp-btn-outline"
              onClick={onClose}
              style={{ height: 36, padding: "0 14px", fontSize: "0.82rem" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bp-btn-solid"
              style={{ height: 36, padding: "0 16px", fontSize: "0.82rem" }}
            >
              {saving ? "Saving..." : "Save Time"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Trade Detail Page (Full Standalone Page View for Screenshots) ─────────────────────
function TradeDetailPage({ trade, onBack }) {
  const navigate = useNavigate();
  const [currentTrade, setCurrentTrade] = useState(trade);
  const [editingType, setEditingType] = useState(null); // 'buy' or 'sell'
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    setCurrentTrade(trade);
  }, [trade]);

  const pnlObj = computeTradePnL(currentTrade);
  const grossPnL = pnlObj.grossPnL;
  const charges = currentTrade.charges || {};
  const totalCharges = Number(charges.total ?? charges.brokerage ?? 0);
  const realisedPnL = pnlObj.realizedPnL;
  const isGrossProfit = grossPnL !== null && grossPnL >= 0;
  const isNetProfit = realisedPnL !== null && realisedPnL >= 0;
  const buyPrice = currentTrade.buyPrice ?? currentTrade.entryPrice ?? 0;
  const sellPrice = pnlObj.isClosed ? pnlObj.markPrice : null;
  const buyExecuted = currentTrade.side !== "sell" || pnlObj.isClosed;
  const sellExecuted = currentTrade.side === "sell" || pnlObj.isClosed;
  const actualBuyPrice = currentTrade.side === "sell" ? sellPrice : buyPrice;
  const actualSellPrice = currentTrade.side === "sell" ? buyPrice : sellPrice;

  const exchangeTag = currentTrade.instrument === "EQUITY" ? "NSE" : (currentTrade.segment === "commodity" ? "MCX" : "NFO");
  const totalUnits = Number(currentTrade.quantity || 1) * Number(currentTrade.lotSize || 1);
  const pnlPercent = buyPrice && grossPnL !== null && totalUnits
    ? ((grossPnL / (buyPrice * totalUnits)) * 100).toFixed(2)
    : null;

  // Check trade category for conditional field visibility
  const isOptions = Boolean(
    currentTrade.instrument === "OPTIDX" ||
    currentTrade.segment === "options" ||
    currentTrade.tradeType === "Options" ||
    currentTrade.optionType ||
    (["NFO", "BFO"].includes(exchangeTag) && currentTrade.strikePrice)
  );

  const isDerivativesOrCommodity = Boolean(
    isOptions ||
    currentTrade.instrument === "FUTIDX" ||
    currentTrade.instrument === "FUTSTK" ||
    ["futures", "commodity", "options"].includes(currentTrade.segment) ||
    ["NFO", "BFO", "MCX"].includes(exchangeTag)
  );

  const handleCaptureScreenshot = async () => {
    const el = document.getElementById("bp-trade-detail-container");
    if (!el) return;
    setCapturing(true);
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(el, {
        scale: 2,
        width: TRADE_CAPTURE_WIDTH,
        windowWidth: TRADE_CAPTURE_WIDTH,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDocument) => {
          clonedDocument
            .getElementById("bp-trade-detail-container")
            ?.classList.add("is-sharing-capture");
        },
      });

      const dataUrl = canvas.toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `Trade_${currentTrade.symbol || "Order"}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: currentTrade.symbol || "Trade Details",
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Screenshot capture error:", err);
    } finally {
      setCapturing(false);
    }
  };

  const handleSaveOrderTime = async (newTimeIso) => {
    const fieldKey = editingType === "buy" ? "buyOrderTime" : "sellOrderTime";
    const updatedTimeline = {
      ...(currentTrade.orderTimeline || {}),
      [fieldKey]: newTimeIso,
    };

    // A timeline-only edit must not turn an SS-style open record's legacy
    // sellPrice/LTP alias into an exit. Send the resolved open mark explicitly
    // while clearing both exit aliases; canonical open records stay unchanged.
    const updatePayload = { orderTimeline: updatedTimeline };
    if (pnlObj.isOpen) {
      updatePayload.status = "open";
      updatePayload.sellPrice = null;
      updatePayload.exitPrice = null;
      updatePayload.ltp = pnlObj.markPrice;
      updatePayload.ltpProvided = pnlObj.hasMarketPrice;
    }

    try {
      const res = await brokerApi.patch(`/api/broker-portal/trades/${currentTrade._id}`, updatePayload);
      if (res.data) {
        setCurrentTrade(res.data);
      }
    } catch (err) {
      console.error("Error updating order time:", err);
    }
  };

  const isOpenTrade = pnlObj.isOpen;
  const ltpVal = pnlObj.markPrice;
  const isLtpRed = currentTrade.ltpColor === "red";
  const ltpColorClass = isLtpRed ? "bp-detail-icon--red" : "bp-detail-icon--green";
  const ltpTextColor = isLtpRed ? "var(--bp-red)" : "var(--bp-green)";

  const qtyLabel = isDerivativesOrCommodity ? "Qty/Lot" : "Qty.";
  const qtyDisplayVal = `${totalUnits}`;

  const detailItems = [
    { icon: <BagIcon />, label: "Product", val: tradeModeLabel(currentTrade.tradeMode), boxClass: "bp-detail-icon" },
    { icon: <GridDotsIcon />, label: qtyLabel, val: qtyDisplayVal, boxClass: "bp-detail-icon" },
    { icon: <WaveIcon />, label: "Instrument", val: currentTrade.instrument || "EQUITY", boxClass: "bp-detail-icon" },
    {
      icon: <UpArrowIcon />,
      label: currentTrade.side === "sell" ? "Entry Sell Price" : "Entry Buy Price",
      val: Number(buyPrice).toFixed(2),
      boxClass: "bp-detail-icon bp-detail-icon--green",
      valueStyle: { color: "var(--bp-green)", fontWeight: 700 }
    },
    ...(isDerivativesOrCommodity ? [{ icon: <CalendarIcon />, label: "Expiry", val: currentTrade.expiryDate ? formatDate(currentTrade.expiryDate) : "–", boxClass: "bp-detail-icon" }] : []),
    ...(isOpenTrade
      ? [{
          icon: <WaveIcon />,
          label: "LTP",
          val: ltpVal === null ? "LTP required" : Number(ltpVal).toFixed(2),
          boxClass: `bp-detail-icon ${ltpColorClass}`,
          valueStyle: { color: ltpTextColor, fontWeight: 700 }
        }]
      : [{
          icon: <DownArrowIcon />,
          label: currentTrade.side === "sell" ? "Exit Buy Price" : "Exit Sell Price",
          val: Number(sellPrice).toFixed(2),
          boxClass: "bp-detail-icon bp-detail-icon--red",
          valueStyle: { color: "var(--bp-red)", fontWeight: 700 }
        }]
    ),
    ...(isOptions ? [{ icon: <TargetIcon />, label: "Strike Price", val: currentTrade.strikePrice ? currentTrade.strikePrice : "–", boxClass: "bp-detail-icon" }] : []),
    ...(isOptions ? [{ icon: <UpDownIcon />, label: "Option Type", val: currentTrade.optionType || "–", boxClass: "bp-detail-icon" }] : []),
  ];

  return (
    <div className="bp-trade-detail-page" id="bp-trade-detail-container">
      {/* ── Page Header ── */}
      <div className="bp-trade-detail-header">
        <button type="button" className="bp-drawer-back" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <div className="bp-drawer-title">
          <h2>{currentTrade.symbol || currentTrade.stockName}</h2>
          <p>{exchangeTag}</p>
        </div>
        <div className="bp-drawer-actions">
          <button
            type="button"
            className="bp-icon-btn-ghost"
            title="Edit Trade"
            onClick={() => navigate(`/account/trades/edit/${currentTrade._id}`)}
            style={{ color: "var(--bp-blue)" }}
          >
            <StarIcon />
          </button>
          <button
            type="button"
            className="bp-icon-btn-ghost"
            title="Take Screenshot / Share"
            onClick={handleCaptureScreenshot}
            disabled={capturing}
            style={{ color: "var(--bp-blue)" }}
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      {/* ── Hidden Share Watermark Tag (Only visible during capture) ── */}
      <div className="bp-trade-share-watermark" style={{ display: "none" }}>
        <span>VERIFIED TRADE EXECUTION STATEMENT</span>
      </div>

      {/* ── Page Content Container ── */}
      <div className="bp-trade-detail-content">
        {/* ── Status Row & Hero P&L Card ── */}
        <div className="bp-trade-detail-section bp-trade-detail-section--status">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`bp-badge bp-badge--${pnlObj.isClosed ? "closed" : "open"}`} style={{ fontSize: "0.72rem", padding: "3px 8px", fontWeight: 700, borderRadius: 6 }}>
                {pnlObj.isClosed ? "CLOSED" : "OPEN"}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--bp-muted)", fontWeight: 600 }}>
                {tradeModeLabel(currentTrade.tradeMode)}
              </span>
            </div>
          </div>

          {/* ── P&L and charges use the same open/closed contract as summaries. ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
            <div style={{
              background: "var(--bp-surface)",
              border: "1px solid var(--bp-border)",
              borderRadius: 14,
              padding: "12px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
            }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--bp-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {isOpenTrade ? "Unrealised P&L" : "Gross P&L"}
              </span>
              <span className={`bp-card-val ${grossPnL === null ? "" : isGrossProfit ? "is-green" : "is-red"}`} style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "Plus Jakarta Sans, sans-serif", fontVariantNumeric: "tabular-nums", marginTop: 4, display: "block" }}>
                {formatSignedPnl(grossPnL)}
              </span>
              <span style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                display: "inline-block",
                marginTop: 6,
                padding: "2px 6px",
                borderRadius: 6,
                background: grossPnL === null ? "var(--bp-surface2)" : isGrossProfit ? "rgba(16, 185, 129, 0.12)" : "rgba(229, 57, 53, 0.12)",
                color: grossPnL === null ? "var(--bp-muted)" : isGrossProfit ? "var(--bp-green)" : "var(--bp-red)"
              }}>
                {pnlPercent === null ? "LTP required" : `${Number(pnlPercent) >= 0 ? "+" : ""}${pnlPercent}%`}
              </span>
            </div>

            <div style={{
              background: "var(--bp-surface)",
              border: "1px solid var(--bp-border)",
              borderRadius: 14,
              padding: "12px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)"
            }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--bp-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {isOpenTrade ? "Brokerage / Charges" : "Realised P&L (Net)"}
              </span>
              <span className={`bp-card-val ${isOpenTrade ? "" : isNetProfit ? "is-green" : "is-red"}`} style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "Plus Jakarta Sans, sans-serif", fontVariantNumeric: "tabular-nums", marginTop: 4, display: "block" }}>
                {isOpenTrade ? formatCurrency(totalCharges) : formatSignedPnl(realisedPnL)}
              </span>
              {isOpenTrade && (
                <span style={{ display: "block", marginTop: 6, color: "var(--bp-muted)", fontSize: "0.7rem", fontWeight: 600 }}>
                  Shown separately from unrealised P&amp;L
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Trade Details ── */}
        <div className="bp-trade-detail-section">
          <p className="bp-section-heading">Trade Details</p>
          <div className="bp-detail-grid">
            {detailItems.map((item, idx) => (
              <div key={idx} className="bp-detail-cell">
                <div className={item.boxClass}>{item.icon}</div>
                <div>
                  <span className="bp-cell-label">{item.label}</span>
                  <span className="bp-cell-val" style={item.valueStyle}>{item.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Order Details ── */}
        <div className="bp-trade-detail-section">
          <div className="bp-section-header">
            <p className="bp-section-heading">Order Details</p>
            <span className="bp-link-btn">View History</span>
          </div>

          <div className="bp-order-cards">
            {/* Buy Order Card */}
            <div
              className="bp-order-card bp-order-card--editable"
              onClick={() => setEditingType("buy")}
            >
              <span className="bp-order-card__title is-green">Buy Order</span>
              <div className="bp-order-card__badge-row">
                <span className="bp-badge bp-badge--complete" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                  {buyExecuted ? "COMPLETE" : "OPEN"}
                </span>
              </div>
              <div className="bp-order-card__footer">
                <span>Qty. {totalUnits} · Price {buyExecuted ? `₹${Number(actualBuyPrice).toFixed(2)}` : "–"}</span>
                <ChevronRight />
              </div>
            </div>

            {/* Sell Order Card */}
            <div
              className="bp-order-card"
            >
              <span className="bp-order-card__title is-red">Sell Order</span>
              <div className="bp-order-card__badge-row">
                <span className="bp-badge bp-badge--complete" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                  {sellExecuted ? "COMPLETE" : "OPEN"}
                </span>
              </div>
              <div className="bp-order-card__footer">
                <span>Qty. {totalUnits} · Price {sellExecuted ? `₹${Number(actualSellPrice).toFixed(2)}` : "–"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Charges Breakdown ── */}
        <div className="bp-trade-detail-section">
          <p className="bp-section-heading">Charges Breakdown</p>
          <div className="bp-charges-card">
            <div className="bp-charge-row">
              <span>Brokerage</span>
              <span>{formatCurrency(charges.brokerage ?? 0)}</span>
            </div>
            <div className="bp-charge-row">
              <span>Exchange Charges</span>
              <span>{formatCurrency(charges.exchangeFee || 0)}</span>
            </div>
            <div className="bp-charge-row">
              <span>SEBI Charges</span>
              <span>{formatCurrency(charges.sebiFee || 0)}</span>
            </div>
            <div className="bp-charge-row">
              <span>GST (0.0%)</span>
              <span>{formatCurrency(charges.gst || 0)}</span>
            </div>
            <div className="bp-charge-row">
              <span>Stamp Duty</span>
              <span>{formatCurrency(charges.stampDuty || 0)}</span>
            </div>
            <div className="bp-charge-row is-total">
              <span>Total Charges</span>
              <span>{formatCurrency(totalCharges)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Footer Action Buttons ── */}
      <div className="bp-trade-detail-footer">
        <button type="button" className="bp-btn-outline">
          <ChartIcon /> View Chart
        </button>
        <button type="button" className="bp-btn-solid">
          <StarIcon /> Add to Watchlist
        </button>
      </div>

      {/* ── Time Edit Modal Popup ── */}
      {editingType === "buy" && (
        <EditOrderTimeModal
          type={editingType}
          currentTime={currentTrade.orderTimeline?.buyOrderTime}
          onClose={() => setEditingType(null)}
          onSave={handleSaveOrderTime}
        />
      )}
    </div>
  );
}

// ── Position Card matching Orders.jpeg ─────────────────────────────────────
function PositionCard({ trade, onClick, selectionMode, isSelected, onToggleSelect }) {
  const pnlObj = computeTradePnL(trade);
  const pnl = pnlObj.pnl;
  const isProfit = pnlObj.isProfit;

  const buyPrice = Number(trade.buyPrice ?? trade.entryPrice ?? 0);
  const sellPrice = pnlObj.isClosed ? pnlObj.markPrice : null;
  const hasSell = pnlObj.isClosed;
  const ltp = pnlObj.isOpen ? pnlObj.markPrice : null;

  const exchangeTag = trade.instrument === "EQUITY" ? "NSE" : (trade.segment === "commodity" ? "MCX" : "NFO");
  const tradeModeText = (trade.tradeMode || "mis").toUpperCase();

  const handleCardClick = (e) => {
    if (selectionMode) {
      e.stopPropagation();
      onToggleSelect(trade._id);
    } else {
      onClick();
    }
  };

  return (
    <div
      className={`bp-position-item ${isSelected ? "is-selected" : ""}`}
      onClick={handleCardClick}
      id={`bp-trade-${trade._id}`}
      style={{ display: "flex", alignItems: "center", gap: 10 }}
    >
      {selectionMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(trade._id)}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1 */}
        <div className="bp-position-row bp-position-row--1">
          <span>Qty. {pnlObj.totalUnits}</span>
          <span>Exit Avg. {hasSell ? Number(sellPrice).toFixed(2) : "–"}</span>
          <span className="bp-order-mode-tag">{tradeModeText} · {pnlObj.isClosed ? "CLOSED" : "OPEN"}</span>
        </div>

        {/* Row 2 */}
        <div className="bp-position-row bp-position-row--2">
          <span className="bp-position-symbol">{trade.symbol || trade.stockName}</span>
          <span className={`bp-position-pnl ${pnl === null ? "" : isProfit ? "is-green" : "is-red"}`}>
            {formatSignedPnl(pnl)}
          </span>
        </div>

        {/* Row 3 */}
        <div className="bp-position-row bp-position-row--3">
          <span>{exchangeTag}</span>
          <span>Entry Avg. {Number(buyPrice).toFixed(2)}</span>
          <span style={{ color: pnlObj.isOpen && ltp !== null ? (trade.ltpColor === "red" ? "var(--bp-red)" : (trade.ltpColor === "green" ? "var(--bp-green)" : "inherit")) : "inherit" }}>
            {pnlObj.isOpen ? `LTP ${ltp === null ? "required" : Number(ltp).toFixed(2)}` : null}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function BrokerTradesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tradeId } = useParams();
  const { selectedClient } = useBrokerAuth();

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Selection mode for bulk deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const trRes = await brokerApi.get("/api/broker-portal/trades");
      setTrades(trRes.data?.trades || trRes.data || []);
      setError("");
    } catch (err) {
      setTrades([]);
      setError(err.response?.data?.message || "Failed to load trades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (location.state?.openForm) {
      navigate("/account/trades/new", { replace: true });
    }
  }, [location.state, navigate]);

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      return !selectedClient || t.clientId?._id === selectedClient._id || t.clientId === selectedClient._id;
    });
  }, [trades, selectedClient]);

  const handleToggleSelectTrade = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected trade(s)?`)) return;

    try {
      await brokerApi.post("/api/broker-portal/trades/delete-selected", { tradeIds: selectedIds });
      setMessage(`${selectedIds.length} trade(s) deleted successfully.`);
      setSelectedIds([]);
      setSelectionMode(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete selected trades.");
    }
  };

  const activeTrade = useMemo(() => {
    if (selectedTrade) return selectedTrade;
    if (tradeId) {
      return trades.find((t) => t._id === tradeId) || null;
    }
    return null;
  }, [selectedTrade, tradeId, trades]);

  const pnlSummary = useMemo(() => summarizeTradePnL(filteredTrades), [filteredTrades]);
  const {
    realizedPnL: realisedPnL,
    unrealizedPnL: unrealisedPnL,
    totalPnL,
    missingLtpCount,
  } = pnlSummary;

  if (activeTrade) {
    return (
      <TradeDetailPage
        trade={activeTrade}
        onBack={() => {
          setSelectedTrade(null);
          navigate("/account/trades");
        }}
      />
    );
  }

  return (
    <div className="bp-page bp-orders-page" style={{ background: "var(--bp-bg)", minHeight: "100vh", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", overflowX: "hidden", boxSizing: "border-box", width: "100%" }}>
      {/* ── Sticky Header ── */}
      <div className="bp-page-header">
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
          Orders
        </h1>
        <div className="bp-page-header__actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="bp-icon-btn-ghost"
            title="Select trades to delete"
            onClick={() => {
              setSelectionMode((v) => !v);
              setSelectedIds([]);
            }}
            style={{
              color: selectionMode ? "var(--bp-blue)" : "var(--bp-text)",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: selectionMode ? "var(--bp-blue-soft)" : "transparent"
            }}
          >
            <StarIcon />
          </button>
          <button
            type="button"
            className="bp-btn-solid"
            style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => navigate("/account/trades/new")}
            id="bp-add-trade-btn"
          >
            <AddIcon /> Add Trade
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      {error && <div style={{ margin: "10px 12px 0", padding: "12px 14px", background: "var(--bp-red-soft)", border: "1px solid rgba(196,100,82,0.2)", borderRadius: "var(--bp-radius)", color: "var(--bp-red)", fontSize: "0.88rem" }}>{error}</div>}
      {message && <div style={{ margin: "10px 12px 0", padding: "12px 14px", background: "var(--bp-green-soft)", border: "1px solid rgba(15,151,114,0.2)", borderRadius: "var(--bp-radius)", color: "var(--bp-green)", fontSize: "0.88rem" }}>{message}</div>}

      {/* ── Selection Action Bar ── */}
      {selectionMode && (
        <div style={{
          margin: "10px 12px 0",
          padding: "10px 14px",
          background: "var(--bp-surface)",
          border: "1px solid var(--bp-border)",
          borderRadius: "var(--bp-radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--bp-shadow)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={filteredTrades.length > 0 && selectedIds.length === filteredTrades.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(filteredTrades.map((t) => t._id));
                } else {
                  setSelectedIds([]);
                }
              }}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--bp-text)" }}>
              {selectedIds.length} Selected
            </span>
          </div>

          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleDeleteSelected}
            style={{
              padding: "6px 14px",
              borderRadius: 16,
              background: selectedIds.length > 0 ? "var(--bp-red)" : "var(--bp-muted2)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.8rem",
              border: "none",
              cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <TrashIcon /> Delete ({selectedIds.length})
          </button>
        </div>
      )}

      {/* ── Sub-header tabs ── */}
      <div className="bp-tab-row">
        <button
          type="button"
          className="bp-tab-btn is-active"
        >
          All Orders ({filteredTrades.length})
        </button>
        <button
          type="button"
          className="bp-tab-btn"
          onClick={() => navigate(ACCOUNT_ROUTES.portfolio)}
        >
          Portfolio
        </button>
      </div>

      {/* ── Summary P&L Card matching Orders.jpeg ── */}
      <div style={{ margin: "10px 12px 0", background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", padding: "16px 14px 12px", boxShadow: "var(--bp-shadow)" }}>
        <div style={{ textAlign: "center", paddingBottom: 14, borderBottom: "1px solid var(--bp-border)" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--bp-muted)", margin: 0, display: "block" }}>Total P&L</span>
          <span style={{ fontSize: "1.65rem", fontWeight: 700, fontFamily: "Inter, sans-serif", margin: "4px 0 0", display: "block", color: totalPnL === null ? "var(--bp-muted)" : totalPnL >= 0 ? "var(--bp-green)" : "var(--bp-red)" }}>
            {formatSignedPnl(totalPnL)}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", marginTop: 14 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block" }}>Realised P&L</span>
            <span style={{ fontSize: "0.98rem", fontWeight: 600, fontFamily: "Inter, sans-serif", display: "block", marginTop: 3, color: realisedPnL >= 0 ? "var(--bp-green)" : "var(--bp-red)" }}>
              {realisedPnL >= 0 ? "+" : ""}{formatCurrency(realisedPnL)}
            </span>
          </div>
          <div style={{ background: "var(--bp-border)", width: 1 }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block" }}>Unrealised P&L</span>
            <span style={{ fontSize: "0.98rem", fontWeight: 600, fontFamily: "Inter, sans-serif", display: "block", marginTop: 3, color: unrealisedPnL === null ? "var(--bp-muted)" : unrealisedPnL >= 0 ? "var(--bp-green)" : "var(--bp-red)" }}>
              {formatSignedPnl(unrealisedPnL)}
            </span>
          </div>
        </div>
      </div>

      {missingLtpCount > 0 && (
        <p className="bp-pnl-data-note" role="status">
          LTP is required for {missingLtpCount} open {missingLtpCount === 1 ? "order" : "orders"}. Unrealised and total P&amp;L stay unavailable until updated.
        </p>
      )}

      {/* ── Sub-note banner ── */}
      <p style={{ textAlign: "center", fontSize: "0.76rem", color: "var(--bp-muted)", margin: "14px 16px 8px" }}>
        Tap on any order to inspect details & charges breakdown
      </p>

      {loading && <div className="bp-loading"><div className="bp-spinner" /></div>}

      {/* ── Position List Cards ── */}
      {!loading && filteredTrades.length > 0 && (
        <div className="bp-position-list" style={{ margin: "0 12px 12px" }}>
          {filteredTrades.map((t) => (
            <PositionCard
              key={t._id}
              trade={t}
              selectionMode={selectionMode}
              isSelected={selectedIds.includes(t._id)}
              onToggleSelect={handleToggleSelectTrade}
              onClick={() => navigate(`/account/trades/${t._id}`)}
            />
          ))}
        </div>
      )}

      {!loading && filteredTrades.length === 0 && (
        <div className="bp-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /></svg>
          <p>No orders recorded</p>
          <button type="button" className="bp-btn-solid" style={{ marginTop: 8, padding: "10px 20px" }} onClick={() => navigate("/account/trades/new")}>Add First Trade</button>
        </div>
      )}

      {/* ── Sticky Bottom MTM Bar matching Orders.jpeg ── */}
      {!loading && filteredTrades.length > 0 && (
        <div className="bp-mtm-bar">
          <span className="bp-mtm-bar__label">Unrealised MTM</span>
          <span className={`bp-mtm-bar__value ${unrealisedPnL === null ? "" : unrealisedPnL >= 0 ? "bp-profit" : "bp-loss"}`}>
            {formatSignedPnl(unrealisedPnL)}
          </span>
        </div>
      )}
    </div>
  );
}
