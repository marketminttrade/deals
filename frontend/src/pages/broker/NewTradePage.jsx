import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brokerApi } from "../../api/client";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { ACCOUNT_ROUTES } from "../../constants/accessConfig";
import { initialsFromName } from "../../utils/formatters";
import { resolveTradeLifecycle } from "../../utils/tradeClassification";

// ── Icons ──────────────────────────────────────────────────
const BackArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bp-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ReceiptIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const InfoCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const EquityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const FuturesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);

const OptionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const CommodityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

function getValidProductType(tradeType, productType) {
  if (productType === "Delivery (CNC)" || productType === "Intraday (MIS)" || productType === "Normal (NRML)") {
    return productType;
  }
  return tradeType === "Equity" ? "Delivery (CNC)" : "Normal (NRML)";
}

// ── Mobile Client Switcher Modal ──────────────────────────
function ClientModal({ clients, selectedId, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.clientCode?.toLowerCase().includes(q) ||
        c.idCode?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--bp-border, #E8ECF2)", margin: "10px auto 4px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--bp-border, #E8ECF2)" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, fontFamily: "Plus Jakarta Sans, sans-serif", color: "var(--bp-text, #0F172A)" }}>
            Select Client Account
          </h2>
          <button type="button" className="bp-icon-btn" onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", color: "var(--bp-text, #0F172A)", cursor: "pointer" }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--bp-border, #E8ECF2)", background: "var(--bp-surface2, #F8F9FC)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bp-surface, #ffffff)", border: "1.5px solid var(--bp-border, #E8ECF2)", borderRadius: 12, padding: "8px 12px" }}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by name or client ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: "1rem", color: "var(--bp-text, #0F172A)", fontFamily: "Inter, Source Sans 3, sans-serif" }}
              autoFocus
            />
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "6px 12px 16px" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "30px 24px", textAlign: "center", color: "var(--bp-muted, #64748B)", fontSize: "0.88rem" }}>
              No clients found
            </div>
          )}
          {filtered.map((client) => {
            const isSel = selectedId === client._id;
            return (
              <button
                key={client._id}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: isSel ? "1.5px solid var(--bp-blue, #0052FF)" : "1px solid transparent",
                  background: isSel ? "rgba(0, 82, 255, 0.08)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  margin: "3px 0",
                  boxSizing: "border-box",
                }}
                onClick={() => { onSelect(client); onClose(); }}
              >
                <div className="bp-avatar bp-avatar--sm" style={{ background: "var(--bp-blue, #0052FF)", flexShrink: 0, width: 38, height: 38, fontSize: "0.85rem", color: "#ffffff", fontWeight: 700, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  {initialsFromName(client.fullName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, color: "var(--bp-text, #0F172A)", fontFamily: "Plus Jakarta Sans, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {client.fullName}
                  </span>
                  <span style={{ display: "block", fontSize: "0.78rem", color: "var(--bp-muted, #64748B)", marginTop: 2 }}>
                    {client.clientCode || client.idCode}
                  </span>
                </div>
                {isSel && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bp-blue, #0052FF)", flexShrink: 0, fontFamily: "Plus Jakarta Sans, sans-serif" }}>Active</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function formatForDatetimeInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

const brokerageModes = {
  percentage: { label: "Percentage (%)", unit: "%", defaultRate: "0.10", help: "Applied to executed entry and exit turnover. LTP is excluded." },
  paisa_per_share: { label: "Paisa / share (sell only)", unit: "paisa", defaultRate: "", help: "Charged once on sold equity shares, including sell-first trades." },
  flat_per_lot: { label: "Flat ₹ / lot", unit: "₹", defaultRate: "20.00", help: "Rate × number of lots, once per trade." },
  flat_per_order: { label: "Flat ₹ / executed order", unit: "₹", defaultRate: "20.00", help: "One charge on entry; two charges after exit." },
};

const initialTradeForm = {
  clientId: "",
  tradeType: "Equity",
  symbol: "",
  exchange: "NSE",
  side: "buy",
  orderType: "Market Order",
  quantity: 0,
  lotSize: 1,
  productType: "Delivery (CNC)",
  priceType: "Market",
  limitPrice: "",
  buyPrice: "",
  sellPrice: "",
  ltp: "",
  ltpColor: "green",
  strikePrice: "",
  expiryDate: "",
  optionType: "CE",
  stopLoss: "",
  target: "",
  validity: "DAY",
  brokerageMode: "percentage",
  brokerageRate: "0.10",
  tradedAt: todayDateString(),
  buyOrderTime: "",
};

export default function NewTradePage() {
  const navigate = useNavigate();
  const { tradeId } = useParams();
  const { selectedClient, setSelectedClient } = useBrokerAuth();

  const isEditing = Boolean(tradeId);

  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(() => ({ ...initialTradeForm, tradedAt: todayDateString() }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [existingTimeline, setExistingTimeline] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const clRes = await brokerApi.get("/api/broker-portal/clients");
        const clientList = clRes.data?.clients || clRes.data || [];
        setClients(clientList);

        if (isEditing) {
          const trRes = await brokerApi.get("/api/broker-portal/trades");
          const allTrades = trRes.data?.trades || trRes.data || [];
          const tradeToEdit = allTrades.find((t) => t._id === tradeId);
          if (tradeToEdit) {
            const lifecycle = resolveTradeLifecycle(tradeToEdit);
            setExistingTimeline(tradeToEdit.orderTimeline || null);
            let type = "Equity";
            if (tradeToEdit.segment === "commodity") type = "Commodity";
            else if (tradeToEdit.instrument === "OPTIDX" || tradeToEdit.segment === "options") type = "Options";
            else if (tradeToEdit.instrument === "FUTSTK" || tradeToEdit.instrument === "FUTIDX" || tradeToEdit.segment === "futures") type = "Futures";

            let pType = "Delivery (CNC)";
            if (tradeToEdit.tradeMode === "mis") pType = "Intraday (MIS)";
            else if (tradeToEdit.tradeMode === "nrml") pType = "Normal (NRML)";

            setForm({
              clientId: tradeToEdit.clientId?._id || tradeToEdit.clientId || "",
              tradeType: type,
              symbol: tradeToEdit.symbol || tradeToEdit.stockName || "",
              exchange: tradeToEdit.exchange || "",
              side: tradeToEdit.side || "buy",
              orderType: "Market Order",
              quantity: tradeToEdit.quantity ?? 0,
              lotSize: tradeToEdit.lotSize || 1,
              productType: getValidProductType(type, pType),
              priceType: "Market",
              limitPrice: "",
              buyPrice: String(tradeToEdit.buyPrice ?? tradeToEdit.entryPrice ?? ""),
              sellPrice: lifecycle.isClosed ? String(lifecycle.exitPrice) : "",
              ltp: tradeToEdit.ltpProvided === false
                ? ""
                : tradeToEdit.ltp !== undefined && tradeToEdit.ltp !== null
                  ? String(tradeToEdit.ltp)
                  : "",
              ltpColor: tradeToEdit.ltpColor || "green",
              strikePrice: tradeToEdit.strikePrice ? String(tradeToEdit.strikePrice) : "",
              expiryDate: tradeToEdit.expiryDate ? tradeToEdit.expiryDate.slice(0, 10) : "",
              optionType: tradeToEdit.optionType || "CE",
              stopLoss: "",
              target: "",
              validity: "DAY",
              brokerageMode: tradeToEdit.brokerageMode || (type === "Equity" ? "percentage" : "flat_per_lot"),
              brokerageRate: String(tradeToEdit.brokeragePercent ?? 0),
              tradedAt: tradeToEdit.tradedAt ? tradeToEdit.tradedAt.slice(0, 10) : todayDateString(),
              buyOrderTime: formatForDatetimeInput(tradeToEdit.orderTimeline?.buyOrderTime || tradeToEdit.tradedAt),
            });
          }
        } else if (clientList.length > 0) {
          const activeClient = clientList.find((client) => client._id === selectedClient?._id) || clientList[0];
          setForm((f) => ({ ...f, clientId: activeClient._id }));
          if (selectedClient?._id !== activeClient._id) setSelectedClient(activeClient);
        }
      } catch {
        setError("Unable to load client data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isEditing, tradeId, selectedClient, setSelectedClient]);

  const activeClientObj = useMemo(() => {
    return clients.find((c) => c._id === form.clientId) || selectedClient || clients[0] || null;
  }, [clients, form.clientId, selectedClient]);

  const handleTradeTypeChange = (type) => {
    const mode = type === "Equity" ? "percentage" : "flat_per_lot";
    let updates = { tradeType: type, brokerageMode: mode, brokerageRate: brokerageModes[mode].defaultRate };
    if (type === "Equity") {
      updates.exchange = "NSE";
      updates.productType = "Delivery (CNC)";
      updates.lotSize = 1;
      updates.strikePrice = "";
      updates.expiryDate = "";
      updates.optionType = "CE";
    } else if (type === "Futures") {
      updates.exchange = "NFO";
      updates.productType = "Normal (NRML)";
      updates.lotSize = 25;
      updates.strikePrice = "";
    } else if (type === "Options") {
      updates.exchange = "NFO";
      updates.productType = "Normal (NRML)";
      updates.lotSize = 25;
      updates.optionType = "CE";
    } else if (type === "Commodity") {
      updates.exchange = "MCX";
      updates.productType = "Normal (NRML)";
      updates.lotSize = 1;
    }
    setForm((f) => ({ ...f, ...updates, productType: getValidProductType(type, f.productType) }));
  };

  const handleQtyChange = (delta) => {
    setForm((f) => ({ ...f, quantity: Math.max(0, Number(f.quantity || 0) + delta) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Number.isSafeInteger(Number(form.quantity)) || Number(form.quantity) < 1) {
      setError("Please enter a positive whole-number quantity.");
      return;
    }
    if (!form.clientId) {
      setError("Please select a client account.");
      return;
    }
    if (!form.symbol.trim()) {
      setError("Please enter a stock or symbol name.");
      return;
    }
    if (!form.buyPrice || Number(form.buyPrice) <= 0) {
      setError("Please enter a valid Buy/Entry Price.");
      return;
    }
    if (String(form.brokerageRate).trim() === "" || !Number.isFinite(Number(form.brokerageRate)) || Number(form.brokerageRate) < 0 || (form.brokerageMode === "percentage" && Number(form.brokerageRate) > 100)) {
      setError("Enter a valid nonnegative brokerage rate (percentage must not exceed 100).");
      return;
    }

    setSaving(true);
    setError("");

    let tradeMode = "cnc";
    if (form.productType === "Intraday (MIS)") tradeMode = "mis";
    else if (form.productType === "Normal (NRML)") tradeMode = "nrml";

    let segment = "intraday";
    if (form.tradeType === "Equity") segment = form.productType === "Delivery (CNC)" ? "delivery" : "intraday";
    else if (form.tradeType === "Futures") segment = "futures";
    else if (form.tradeType === "Options") segment = "options";
    else if (form.tradeType === "Commodity") segment = "commodity";

    let instrument = "EQUITY";
    if (form.tradeType === "Options") instrument = "OPTIDX";
    else if (form.tradeType === "Futures") instrument = "FUTIDX";
    else if (form.tradeType === "Commodity") instrument = "FUTSTK";

    const hasSellPrice = String(form.sellPrice ?? "").trim() !== "";
    const sellPriceNum = hasSellPrice ? Number(form.sellPrice) : null;

    const payload = {
      clientId: form.clientId,
      stockName: form.symbol.trim().toUpperCase(),
      symbol: form.symbol.trim().toUpperCase(),
      instrument,
      tradeMode,
      segment,
      exchange: form.exchange,
      side: form.side,
      quantity: Number(form.quantity),
      lotSize: Number(form.lotSize || 1),
      strikePrice: form.strikePrice ? Number(form.strikePrice) : null,
      expiryDate: form.expiryDate || null,
      optionType: form.tradeType === "Options" ? form.optionType : "",
      buyPrice: Number(form.buyPrice),
      entryPrice: Number(form.buyPrice),
      sellPrice: sellPriceNum,
      exitPrice: sellPriceNum,
      // Keep blank LTP distinct from a genuine LTP equal to the entry price.
      // The backend retains its v2 numeric fallback for stored calculations.
      ltp: String(form.ltp ?? "").trim() !== "" ? Number(form.ltp) : null,
      ltpProvided: String(form.ltp ?? "").trim() !== "",
      ltpColor: form.ltpColor || "green",
      brokeragePercent: Number(form.brokerageRate),
      brokerageMode: form.brokerageMode,
      status: hasSellPrice ? "closed" : "open",
      tradedAt: form.tradedAt || todayDateString(),
      orderTimeline: {
        ...(existingTimeline || {}),
        buyOrderTime: form.buyOrderTime ? new Date(form.buyOrderTime).toISOString() : null,
      },
    };

    try {
      if (isEditing) {
        await brokerApi.patch(`/api/broker-portal/trades/${tradeId}`, payload);
      } else {
        await brokerApi.post("/api/broker-portal/trades", payload);
      }

      navigate(ACCOUNT_ROUTES.trades);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save trade order.");
    } finally {
      setSaving(false);
    }
  };
  // Ensure current productType matches valid options for active tradeType
  const currentValidProductType = getValidProductType(form.tradeType, form.productType);

  return (
    <div className="bp-page bp-new-trade-page" style={{ background: "var(--bp-bg, #F2F4F7)", minHeight: "100vh", paddingBottom: 90, width: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
      {/* ── Top Fixed Header Bar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--bp-surface, #ffffff)",
          borderBottom: "1px solid var(--bp-border, #E8ECF2)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "var(--bp-surface2, #F8F9FC)", color: "var(--bp-text, #0F172A)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <BackArrowIcon />
          </button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--bp-text, #0F172A)", fontFamily: "Plus Jakarta Sans, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {isEditing ? "Edit Trade" : "New Trade"}
            </h1>
            <p style={{ fontSize: "0.78rem", color: "var(--bp-muted, #64748B)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {isEditing ? "Modify trade execution details" : "Place a new trade order for client"}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Help"
          style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "var(--bp-surface2, #F8F9FC)", color: "var(--bp-muted, #64748B)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <HelpIcon />
        </button>
      </div>

      {/* ── Containerized Mobile Viewport ── */}
      <div style={{ width: "100%", maxWidth: 500, margin: "0 auto", padding: "14px 12px", boxSizing: "border-box", overflowX: "hidden" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, width: "100%", boxSizing: "border-box" }}>
          {error && (
            <div style={{ padding: "12px 14px", background: "var(--bp-red-soft, #FFF1EF)", border: "1px solid rgba(196,100,82,0.3)", borderRadius: 12, color: "var(--bp-red, #C46452)", fontSize: "0.85rem", fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* ── CARD 1: Select Client ── */}
          <div
            onClick={() => setShowClientModal(true)}
            style={{
              background: "var(--bp-surface, #ffffff)",
              border: "1px solid var(--bp-border, #E8ECF2)",
              borderRadius: "16px",
              padding: "14px 16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            <div
              className="bp-avatar"
              style={{
                background: "var(--bp-blue, #0052FF)",
                width: 44,
                height: 42,
                fontSize: "0.95rem",
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 700,
                fontFamily: "Plus Jakarta Sans, sans-serif"
              }}
            >
              {activeClientObj ? initialsFromName(activeClientObj.fullName) : "–"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--bp-blue, #0052FF)", display: "block", textTransform: "uppercase", letterSpacing: "0.04em" }}>Client Account *</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--bp-text, #0F172A)", fontFamily: "Plus Jakarta Sans, sans-serif", display: "block", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeClientObj ? activeClientObj.fullName : "Choose Client Account"}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--bp-muted, #64748B)", display: "block", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeClientObj ? (activeClientObj.clientCode || activeClientObj.idCode) : "Tap to select account"}
              </span>
            </div>

            <div style={{ color: "var(--bp-muted, #64748B)", flexShrink: 0 }}>
              <ChevronDownIcon />
            </div>
          </div>

          {/* ── CARD 2: Trade Type Grid Selector ── */}
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--bp-text, #0F172A)", fontFamily: "Plus Jakarta Sans, sans-serif", display: "block", marginBottom: 6 }}>
              Trade Segment
            </label>
            <div className="bp-trade-type-grid">
              {[
                { id: "Equity", label: "Equity", Icon: EquityIcon },
                { id: "Futures", label: "Futures", Icon: FuturesIcon },
                { id: "Options", label: "Options", Icon: OptionsIcon },
                { id: "Commodity", label: "Commodity", Icon: CommodityIcon },
              ].map(({ id, label, Icon }) => {
                const isSel = form.tradeType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleTradeTypeChange(id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      padding: "10px 4px",
                      borderRadius: 12,
                      border: isSel ? "1.5px solid var(--bp-blue, #0052FF)" : "1px solid var(--bp-border, #E8ECF2)",
                      background: isSel ? "rgba(0, 82, 255, 0.08)" : "var(--bp-surface, #ffffff)",
                      color: isSel ? "var(--bp-blue, #0052FF)" : "var(--bp-muted, #64748B)",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      WebkitTapHighlightColor: "transparent",
                      minWidth: 0,
                    }}
                  >
                    <Icon />
                    <span style={{ fontSize: "11px", fontWeight: isSel ? 700 : 600, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── CARD 3: Main Trade Form Box ── */}
          <div style={{ background: "#ffffff", border: "1px solid #E8ECF2", borderRadius: "16px", padding: "14px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "grid", gap: 12, boxSizing: "border-box", width: "100%" }}>
            {/* Row 1: Symbol + Exchange */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">Symbol / Company *</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type="text"
                    className="bp-input"
                    style={{ textTransform: "uppercase", paddingLeft: 30, width: "100%", boxSizing: "border-box" }}
                    placeholder="e.g. RELIANCE"
                    value={form.symbol}
                    onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                    required
                  />
                  <div style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <SearchIcon />
                  </div>
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label" htmlFor="trade-exchange">Exchange *</label>
                <select
                  id="trade-exchange"
                  className="bp-select"
                  value={form.exchange}
                  onChange={(e) => setForm((f) => ({ ...f, exchange: e.target.value }))}
                  required
                  style={{ width: "100%", boxSizing: "border-box", color: "#0F172A", backgroundColor: "#ffffff" }}
                >
                  <option value="" disabled>Select exchange</option>
                  {form.tradeType === "Equity" && (
                    <>
                      <option value="NSE" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>NSE</option>
                      <option value="BSE" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>BSE</option>
                    </>
                  )}
                  {form.tradeType === "Futures" && (
                    <>
                      <option value="NFO" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>NFO</option>
                      <option value="BFO" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>BFO</option>
                      <option value="MCX" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>MCX</option>
                    </>
                  )}
                  {form.tradeType === "Options" && (
                    <>
                      <option value="NFO" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>NFO</option>
                      <option value="BFO" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>BFO</option>
                      <option value="MCX" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>MCX</option>
                    </>
                  )}
                  {form.tradeType === "Commodity" && (
                    <option value="MCX" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>MCX</option>
                  )}
                </select>
              </div>
            </div>

            {/* Row 2: Transaction Side + Order Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">Transaction *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, side: "buy" }))}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      border: form.side === "buy" ? "1.5px solid var(--bp-green, #10B981)" : "1px solid #E8ECF2",
                      background: form.side === "buy" ? "rgba(16, 185, 129, 0.12)" : "#F8F9FC",
                      color: form.side === "buy" ? "var(--bp-green, #10B981)" : "#64748B",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      minWidth: 0,
                    }}
                  >
                    ↗ BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, side: "sell" }))}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      border: form.side === "sell" ? "1.5px solid var(--bp-red, #E53935)" : "1px solid #E8ECF2",
                      background: form.side === "sell" ? "rgba(229, 57, 53, 0.12)" : "#F8F9FC",
                      color: form.side === "sell" ? "var(--bp-red, #E53935)" : "#64748B",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      minWidth: 0,
                    }}
                  >
                    ↘ SELL
                  </button>
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">Order Type *</label>
                <select
                  className="bp-select"
                  value={form.orderType}
                  onChange={(e) => setForm((f) => ({ ...f, orderType: e.target.value }))}
                  required
                  style={{ width: "100%", boxSizing: "border-box", color: "#0F172A", backgroundColor: "#ffffff" }}
                >
                  <option value="Market Order" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>Market Order</option>
                  <option value="Limit Order" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>Limit Order</option>
                  <option value="SL (Stop-Loss)" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>SL (Stop-Loss)</option>
                  <option value="SL-M (Stop-Loss Market)" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>SL-M (Stop-Loss Market)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Quantity Stepper + Lot Size */}
            <div style={{ display: "grid", gridTemplateColumns: form.tradeType === "Equity" ? "1fr" : "1fr 1fr", gap: 10, width: "100%" }}>
              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">{form.tradeType === "Equity" ? "Quantity (Shares) *" : "No. of Lots *"}</label>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E8ECF2", borderRadius: 12, background: "#ffffff", overflow: "hidden", height: 44, width: "100%", boxSizing: "border-box" }}>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(-1)}
                    aria-label="Decrease quantity"
                    style={{ width: 36, height: "100%", border: "none", background: "#F8F9FC", fontSize: "18px", fontWeight: 700, color: "#0F172A", cursor: "pointer", flexShrink: 0 }}
                  >
                    –
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    aria-label="Quantity"
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    style={{ flex: 1, minWidth: 0, border: "none", outline: "none", textAlign: "center", fontSize: "1rem", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange(1)}
                    aria-label="Increase quantity"
                    style={{ width: 36, height: "100%", border: "none", background: "#F8F9FC", fontSize: "18px", fontWeight: 700, color: "#0F172A", cursor: "pointer", flexShrink: 0 }}
                  >
                    +
                  </button>
                </div>
              </div>

              {form.tradeType !== "Equity" && (
                <div style={{ minWidth: 0 }}>
                  <label className="bp-form-label">Lot Size *</label>
                  <input
                    type="number"
                    min="1"
                    className="bp-input"
                    value={form.lotSize}
                    onChange={(e) => setForm((f) => ({ ...f, lotSize: Math.max(1, Number(e.target.value)) }))}
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              )}
            </div>

            {/* Row 4: Product Type + Traded Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">Product Type *</label>
                <select
                  className="bp-select"
                  value={currentValidProductType}
                  onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value }))}
                  required
                  style={{ width: "100%", boxSizing: "border-box", color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}
                >
                  <option value="Delivery (CNC)" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>Delivery (CNC)</option>
                  <option value="Intraday (MIS)" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>Intraday (MIS)</option>
                  <option value="Normal (NRML)" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>Normal (NRML)</option>
                </select>
              </div>

              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">Traded Date *</label>
                <input
                  type="date"
                  className="bp-input"
                  value={form.tradedAt}
                  onChange={(e) => setForm((f) => ({ ...f, tradedAt: e.target.value }))}
                  required
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Derivatives Specific Fields */}
            {(form.tradeType === "Options" || form.tradeType === "Futures" || form.tradeType === "Commodity") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, width: "100%" }}>
                <div style={{ minWidth: 0 }}>
                  <label className="bp-form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="bp-input"
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            {form.tradeType === "Options" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
                <div style={{ minWidth: 0 }}>
                  <label className="bp-form-label">Strike Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="bp-input"
                    placeholder="e.g. 24000"
                    value={form.strikePrice}
                    onChange={(e) => setForm((f) => ({ ...f, strikePrice: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ minWidth: 0 }}>
                  <label className="bp-form-label">Option Type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, optionType: "CE" }))}
                      className={`bp-segmented-btn${form.optionType === "CE" ? " is-active" : ""}`}
                      style={{ height: 44, borderRadius: 10, fontWeight: 700, fontSize: "13px", minWidth: 0 }}
                    >
                      CE
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, optionType: "PE" }))}
                      className={`bp-segmented-btn${form.optionType === "PE" ? " is-active" : ""}`}
                      style={{ height: 44, borderRadius: 10, fontWeight: 700, fontSize: "13px", minWidth: 0 }}
                    >
                      PE
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Price Type + Limit Price */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">Price Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, background: "#F8F9FC", padding: 3, borderRadius: 10, border: "1px solid #E8ECF2" }}>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priceType: "Market", orderType: "Market Order" }))}
                    style={{
                      height: 36,
                      borderRadius: 8,
                      border: form.priceType === "Market" ? "1px solid #E8ECF2" : "none",
                      background: form.priceType === "Market" ? "#ffffff" : "transparent",
                      color: form.priceType === "Market" ? "#0052FF" : "#64748B",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      minWidth: 0,
                    }}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priceType: "Limit", orderType: "Limit Order" }))}
                    style={{
                      height: 36,
                      borderRadius: 8,
                      border: form.priceType === "Limit" ? "1px solid #E8ECF2" : "none",
                      background: form.priceType === "Limit" ? "#ffffff" : "transparent",
                      color: form.priceType === "Limit" ? "#0052FF" : "#64748B",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      minWidth: 0,
                    }}
                  >
                    Limit
                  </button>
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">Limit Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  className="bp-input"
                  placeholder="0.00"
                  disabled={form.priceType === "Market"}
                  value={form.limitPrice}
                  onChange={(e) => setForm((f) => ({ ...f, limitPrice: e.target.value }))}
                  style={{ opacity: form.priceType === "Market" ? 0.4 : 1, width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Buy Price, Sell Price & Live LTP */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, width: "100%" }}>
              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">{form.side === "sell" ? "Entry Sell Price (₹) *" : "Entry Buy Price (₹) *"}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="bp-input"
                  placeholder="0.00"
                  value={form.buyPrice}
                  onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
                  required
                  style={{ width: "100%", boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">{form.side === "sell" ? "Exit Buy Price (₹)" : "Exit Sell Price (₹)"}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="bp-input"
                  placeholder="Optional (Closed)"
                  value={form.sellPrice}
                  onChange={(e) => setForm((f) => ({ ...f, sellPrice: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <label className="bp-form-label" style={{ marginBottom: 0 }}>LTP (₹)</label>
                  <div style={{ display: "flex", gap: 2, background: "var(--bp-surface2, #F8F9FC)", padding: 2, borderRadius: 6, border: "1px solid var(--bp-border, #E8ECF2)" }}>
                    <button
                      type="button"
                      title="Set LTP Green"
                      onClick={() => setForm((f) => ({ ...f, ltpColor: "green" }))}
                      style={{
                        padding: "1px 5px",
                        fontSize: "9px",
                        fontWeight: 700,
                        borderRadius: 4,
                        border: "none",
                        cursor: "pointer",
                        background: form.ltpColor === "green" ? "var(--bp-green, #10B981)" : "transparent",
                        color: form.ltpColor === "green" ? "#ffffff" : "var(--bp-muted, #6B7280)",
                      }}
                    >
                      ▲ G
                    </button>
                    <button
                      type="button"
                      title="Set LTP Red"
                      onClick={() => setForm((f) => ({ ...f, ltpColor: "red" }))}
                      style={{
                        padding: "1px 5px",
                        fontSize: "9px",
                        fontWeight: 700,
                        borderRadius: 4,
                        border: "none",
                        cursor: "pointer",
                        background: form.ltpColor === "red" ? "var(--bp-red, #E53935)" : "transparent",
                        color: form.ltpColor === "red" ? "#ffffff" : "var(--bp-muted, #6B7280)",
                      }}
                    >
                      ▼ R
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="bp-input"
                  placeholder="0.20"
                  value={form.ltp}
                  onChange={(e) => setForm((f) => ({ ...f, ltp: e.target.value }))}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    fontVariantNumeric: "tabular-nums",
                    color: form.ltpColor === "red" ? "var(--bp-red, #E53935)" : "var(--bp-green, #10B981)",
                    fontWeight: 700
                  }}
                />
                {!form.sellPrice && !String(form.ltp || "").trim() && (
                  <small style={{ display: "block", marginTop: 5, color: "var(--bp-muted, #6B7280)", fontSize: "0.7rem", lineHeight: 1.3 }}>
                    Enter LTP to calculate unrealised P&amp;L. Until then it will show as unavailable.
                  </small>
                )}
              </div>
            </div>

            {/* Optional buy execution time; sell timestamps are not collected. */}
            <div style={{ display: "grid", gap: 10, width: "100%" }}>
              <div style={{ minWidth: 0 }}>
                <label className="bp-form-label">Buy Order Time</label>
                <input
                  type="datetime-local"
                  className="bp-input"
                  value={form.buyOrderTime}
                  onChange={(e) => setForm((f) => ({ ...f, buyOrderTime: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

            </div>
          </div>

          {/* ── CARD 4: Advanced Options Accordion ── */}
          <div style={{ background: "#ffffff", border: "1px solid #E8ECF2", borderRadius: "16px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                textAlign: "left",
                boxSizing: "border-box",
              }}
            >
              <div style={{ color: "#64748B", flexShrink: 0 }}>
                <GearIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif", display: "block" }}>
                  Advanced Options
                </span>
                <span style={{ fontSize: "11px", color: "#64748B", display: "block", marginTop: 1 }}>
                  Stop loss, target, validity
                </span>
              </div>
              <div style={{ color: "#64748B", flexShrink: 0 }}>
                {showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </div>
            </button>

            {showAdvanced && (
              <div style={{ padding: "0 14px 14px", borderTop: "1px solid #E8ECF2", display: "grid", gap: 10, paddingTop: 12, width: "100%", boxSizing: "border-box" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
                  <div style={{ minWidth: 0 }}>
                    <label className="bp-form-label">Stop Loss (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      className="bp-input"
                      placeholder="0.00"
                      value={form.stopLoss}
                      onChange={(e) => setForm((f) => ({ ...f, stopLoss: e.target.value }))}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <label className="bp-form-label">Target (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      className="bp-input"
                      placeholder="0.00"
                      value={form.target}
                      onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ width: "100%" }}>
                  <label className="bp-form-label">Order Validity</label>
                  <select
                    className="bp-select"
                    value={form.validity}
                    onChange={(e) => setForm((f) => ({ ...f, validity: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", color: "#0F172A", backgroundColor: "#ffffff" }}
                  >
                    <option value="DAY" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>DAY (Good for day)</option>
                    <option value="IOC" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>IOC (Immediate or Cancel)</option>
                    <option value="AMO" style={{ color: "var(--bp-text)", backgroundColor: "var(--bp-surface)" }}>AMO (After Market Order)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── CARD 5: Brokerage & Charges Box ── */}
          <div style={{ background: "#ffffff", border: "1px solid #E8ECF2", borderRadius: "16px", padding: "14px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "grid", gap: 12, boxSizing: "border-box", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ReceiptIcon />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                  Brokerage & Charges
                </span>
              </div>
            </div>

            <div>
              <label className="bp-form-label" htmlFor="brokerage-mode">Brokerage Mode</label>
              <select id="brokerage-mode" className="bp-select" value={form.brokerageMode}
                onChange={(e) => setForm((f) => ({ ...f, brokerageMode: e.target.value, brokerageRate: brokerageModes[e.target.value].defaultRate }))}>
                {Object.entries(brokerageModes).filter(([mode]) => mode !== "paisa_per_share" || form.tradeType === "Equity").map(([mode, config]) => (
                  <option key={mode} value={mode}>{config.label}</option>
                ))}
              </select>
              <label className="bp-form-label" htmlFor="brokerage-rate">Brokerage Rate ({brokerageModes[form.brokerageMode]?.unit}) *</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#0052FF" }}>{brokerageModes[form.brokerageMode]?.unit}</span>
                <input
                  id="brokerage-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max={form.brokerageMode === "percentage" ? 100 : undefined}
                  className="bp-input"
                  style={{ flex: 1, minWidth: 0, width: "100%", boxSizing: "border-box" }}
                  value={form.brokerageRate}
                  onChange={(e) => setForm((f) => ({ ...f, brokerageRate: e.target.value }))}
                  required
                />
              </div>
              <p style={{ fontSize: 12, color: "#64748B" }}>{brokerageModes[form.brokerageMode]?.help}</p>
            </div>

            {/* Charges Breakdown Grid */}
            <div style={{ background: "#F8F9FC", borderRadius: 12, padding: "10px 12px", border: "1px solid #E8ECF2" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>STT</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>₹0.00</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Exchange Charges</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>₹0.00</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>GST (0%)</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>₹0.00</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>SEBI Charges</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>₹0.00</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Stamp Duty</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>₹0.00</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>DP Charges</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>₹0.00</span>
                </div>
              </div>
            </div>

            <span style={{ fontSize: "11px", color: "#64748B", fontStyle: "italic" }}>
              Note: Only brokerage is editable. All other charges are set to ₹0.00.
            </span>
          </div>

          {/* ── CARD 6: Order Summary Live Preview ── */}
          <div style={{ background: "#ffffff", border: "1px solid #E8ECF2", borderRadius: "16px", padding: "14px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "grid", gap: 10, boxSizing: "border-box", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <DocumentIcon />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                Order Summary
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "13px", width: "100%" }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Client</span>
                <strong style={{ color: "#0F172A", display: "block", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeClientObj ? `${activeClientObj.fullName}` : "–"}
                </strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Exchange</span>
                <strong style={{ color: "#0F172A", display: "block", marginTop: 1 }}>{form.exchange}</strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Symbol</span>
                <strong style={{ color: "#0F172A", display: "block", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {form.symbol || "–"}
                </strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Order Type</span>
                <strong style={{ color: "#0F172A", display: "block", marginTop: 1 }}>{form.orderType}</strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Transaction</span>
                <strong style={{ color: form.side === "buy" ? "var(--bp-green, #10B981)" : "var(--bp-red, #E53935)", display: "block", marginTop: 1 }}>
                  {form.side.toUpperCase()}
                </strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Product Type</span>
                <strong style={{ color: "#0F172A", display: "block", marginTop: 1 }}>{currentValidProductType}</strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>
                  {form.tradeType === "Equity" ? "Quantity" : "Lots & Units"}
                </span>
                <strong style={{ color: "#0F172A", display: "block", marginTop: 1 }}>
                  {form.tradeType === "Equity"
                    ? `${Number(form.quantity || 1)} Shares`
                    : `${Number(form.quantity || 1)} Lots (${Number(form.quantity || 1) * Number(form.lotSize || 1)} Units)`}
                </strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Price Type</span>
                <strong style={{ color: "#0F172A", display: "block", marginTop: 1 }}>{form.priceType}</strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Entry Price</span>
                <strong style={{ color: "#0F172A", display: "block", marginTop: 1 }}>
                  {form.buyPrice ? `₹${Number(form.buyPrice).toFixed(2)}` : "–"}
                </strong>
              </div>

              <div style={{ minWidth: 0 }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Exit Price</span>
                <strong style={{ color: form.sellPrice ? "var(--bp-text, #0F172A)" : "var(--bp-green, #10B981)", display: "block", marginTop: 1 }}>
                  {form.sellPrice ? `₹${Number(form.sellPrice).toFixed(2)}` : "Open Position"}
                </strong>
              </div>
            </div>

            <div style={{ background: "rgba(0, 82, 255, 0.05)", border: "1px solid rgba(0, 82, 255, 0.15)", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "flex-start", gap: 8, marginTop: 2 }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}><InfoCircleIcon /></div>
              <span style={{ fontSize: "12px", color: "#0052FF", fontWeight: 500, lineHeight: 1.35 }}>
                <strong>Note:</strong> {form.priceType === "Market" ? "Market order executes at best available price." : `Limit order executes at ₹${form.limitPrice || "0.00"} or better.`}
              </span>
            </div>
          </div>

          {/* ── CARD 7: Action Footer Buttons ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4, width: "100%" }}>
            <button
              type="button"
              className="bp-btn-outline"
              style={{ height: 48, fontSize: "14px", borderRadius: 12, minWidth: 0 }}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bp-btn-solid"
              style={{ height: 48, fontSize: "14px", borderRadius: 12, minWidth: 0 }}
              disabled={saving || loading}
            >
              {saving ? "Saving..." : isEditing ? "Update Order" : "Review Order"}
            </button>
          </div>
        </form>
      </div>

      {showClientModal && (
        <ClientModal
          clients={clients}
          selectedId={form.clientId}
          onSelect={(c) => {
            setForm((f) => ({ ...f, clientId: c._id }));
            setSelectedClient(c);
          }}
          onClose={() => setShowClientModal(false)}
        />
      )}
    </div>
  );
}
