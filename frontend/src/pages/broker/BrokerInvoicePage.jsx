import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { brokerApi } from "../../api/client";
import BrokerInvoicePreview from "../../components/invoices/BrokerInvoicePreview";
import EmptyState from "../../components/EmptyState";
import SectionTabs from "../../components/SectionTabs";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { downloadBrokerInvoicePdf } from "../../utils/invoicePdf";
import { formatAmount, formatDate, formatRupee } from "../../utils/formatters";

const AVATAR_PALETTE = [
  { bg: "#E0F2FE", color: "#0284C7" }, // Light Blue
  { bg: "#F3E8FF", color: "#9333EA" }, // Light Purple
  { bg: "#FEF3C7", color: "#D97706" }, // Light Amber
  { bg: "#FEE2E2", color: "#DC2626" }, // Light Red
  { bg: "#DCFCE7", color: "#16A34A" }, // Light Green
  { bg: "#E0E7FF", color: "#4F46E5" }, // Light Indigo
  { bg: "#FCE7F3", color: "#DB2777" }, // Light Pink
];

function getAvatarStyle(index) {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
}

function getInitials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "CL";
}

function downloadBrokerInvoiceExcel({ broker, client, trades, summary, statementNumber, filters }) {
  const lines = [];
  lines.push(`BROKER,${broker?.branding?.brokerageHouseName || broker?.name || "Dhanlaxmi Finance"}`);
  lines.push(`STATEMENT NO,${statementNumber}`);
  lines.push(`CLIENT NAME,${client?.fullName || ""}`);
  lines.push(`CLIENT ID,${client?.clientCode || client?.idCode || ""}`);
  lines.push(`PERIOD,${filters?.fromDate || ""} to ${filters?.toDate || ""}`);
  lines.push("");
  lines.push("Sr. No.,Segment,Product,Symbol,Buy/Sell,Quantity,Entry Price,Exit Price,Trade Value,Brokerage,Net P&L");

  (trades || []).forEach((t, i) => {
    const units = Number(t.quantity || 1) * Number(t.lotSize || 1);
    lines.push([
      i + 1,
      t.segment || "EQ",
      t.tradeMode || "Delivery",
      `"${t.symbol || t.stockName || ""}"`,
      String(t.side || "").toUpperCase(),
      units,
      t.buyPrice || t.entryPrice || 0,
      t.sellPrice || t.exitPrice || 0,
      t.totalBuy || ((t.buyPrice || t.entryPrice || 0) * units),
      t.charges?.total || t.charges?.brokerage || 0,
      t.netPnL || 0,
    ].join(","));
  });

  lines.push("");
  lines.push(`TOTAL TURNOVER,${summary?.totalBuy || summary?.turnover || 0}`);
  lines.push(`TOTAL BROKERAGE,${summary?.totalBrokerage || 0}`);
  lines.push(`GROSS P&L,${summary?.grossPnL || 0}`);
  lines.push(`NET P&L,${summary?.netPnL || 0}`);

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Invoice_${client?.fullName || "Client"}_${statementNumber.replace(/[/]/g, "-")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function BrokerInvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { broker, selectedClient } = useBrokerAuth();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(selectedClient?._id || "");
  const [quickSelect, setQuickSelect] = useState("this_month");
  const [invoiceFormat, setInvoiceFormat] = useState("pdf"); // "pdf" | "excel"

  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    return {
      fromDate: startOfMonth,
      toDate: today,
    };
  });

  const [toggles, setToggles] = useState({
    showChargesBreakup: broker?.documents?.showChargesBreakup !== false,
    showTaxSummary: broker?.documents?.showTaxSummary !== false,
    showClientContact: broker?.documents?.showClientContact !== false,
    showStamp: broker?.documents?.showStamp !== false,
    showFooterNotes: broker?.documents?.showFooterNotes !== false,
  });

  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("generate");
  const [showTogglesPanel, setShowTogglesPanel] = useState(false);

  useEffect(() => {
    if (broker?.documents) {
      setToggles({
        showChargesBreakup: broker.documents.showChargesBreakup !== false,
        showTaxSummary: broker.documents.showTaxSummary !== false,
        showClientContact: broker.documents.showClientContact !== false,
        showStamp: broker.documents.showStamp !== false,
        showFooterNotes: broker.documents.showFooterNotes !== false,
      });
    }
  }, [broker]);

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const response = await brokerApi.get("/api/broker-portal/clients");
      setCustomers(response.data);
      if (!response.data.some((client) => client._id === selectedClientId)) {
        setSelectedClientId(response.data[0]?._id || "");
        setInvoiceData(null);
      }
      setError("");
    } catch (requestError) {
      setCustomers([]);
      setError(requestError.response?.data?.message || "Unable to load customers.");
    } finally {
      setLoadingCustomers(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const requestedTab = location.state?.activeTab;
    if (!requestedTab) {
      return;
    }

    setActiveTab(requestedTab);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!invoiceData && activeTab !== "generate") {
      setActiveTab("generate");
    }
  }, [activeTab, invoiceData]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) => c.fullName?.toLowerCase().includes(q) || c.idCode?.toLowerCase().includes(q) || c.clientCode?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleToggleChange = (key, value) => {
    const updated = { ...toggles, [key]: value };
    setToggles(updated);
    brokerApi.patch("/api/broker-portal/dashboard/invoice-settings", { [key]: value }).catch(() => {});
  };

  const handleQuickSelect = (key) => {
    setQuickSelect(key);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (key === "today") {
      setFilters({ fromDate: today, toDate: today });
    } else if (key === "this_week") {
      const day = now.getDay() || 7;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - day + 1);
      setFilters({ fromDate: startOfWeek.toISOString().slice(0, 10), toDate: today });
    } else if (key === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setFilters({ fromDate: startOfMonth.toISOString().slice(0, 10), toDate: today });
    } else if (key === "last_month") {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setFilters({
        fromDate: startOfLastMonth.toISOString().slice(0, 10),
        toDate: endOfLastMonth.toISOString().slice(0, 10),
      });
    } else {
      // "custom"
    }
  };

  const statementNumber = useMemo(() => {
    const client = customers.find((item) => item._id === selectedClientId);
    const prefix = broker?.documents?.statementPrefix || "INV";
    const idCode = client?.clientCode || client?.idCode || "1509394";
    return `${prefix}/2505/${idCode}`;
  }, [broker?.documents?.statementPrefix, customers, selectedClientId]);

  const tabs = useMemo(
    () => [
      { key: "generate", label: "Generate" },
      { key: "preview", label: "Preview", disabled: !invoiceData },
      { key: "trades", label: "Included trades", badge: invoiceData?.trades?.length || 0, disabled: !invoiceData },
    ],
    [invoiceData]
  );

  async function fetchInvoiceData() {
    if (!selectedClientId) throw new Error("Please select a client.");
    const response = await brokerApi.get(
      `/api/broker-portal/invoices/preview?clientId=${selectedClientId}&fromDate=${filters.fromDate}&toDate=${filters.toDate}`
    );
    return response.data;
  }

  async function handleDownloadInvoice() {
    if (!selectedClientId) {
      setError("Please select a client.");
      return;
    }
    setLoadingAction(true);
    setError("");

    try {
      const data = await fetchInvoiceData();
      setInvoiceData(data);

      if (invoiceFormat === "excel") {
        downloadBrokerInvoiceExcel({
          broker: data.broker,
          client: data.client,
          trades: data.trades,
          filters: data.filters,
          summary: data.summary,
          statementNumber,
        });
      } else {
        downloadBrokerInvoicePdf({
          broker: data.broker,
          client: data.client,
          trades: data.trades,
          filters: data.filters,
          summary: data.summary,
          statementNumber,
          toggles,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to download invoice.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handlePreview(e) {
    if (e) e.preventDefault();
    if (!selectedClientId) return;
    setLoadingAction(true);
    setError("");

    try {
      const data = await fetchInvoiceData();
      setInvoiceData(data);
      setActiveTab("preview");
    } catch (err) {
      setInvoiceData(null);
      setError(err.response?.data?.message || err.message || "Unable to generate preview.");
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <section className="invoice-mobile-shell">
      {/* ── Top Mobile Header ── */}
      <header className="invoice-mobile-header">
        <button type="button" className="invoice-mobile-header__back" onClick={() => navigate(-1)} aria-label="Go back">
          &larr;
        </button>
        <div>
          <h1 className="invoice-mobile-header__title">Invoice</h1>
          <p className="invoice-mobile-header__subtitle">Select client and date range to download invoices</p>
        </div>
      </header>

      {error ? <div className="alert-strip" style={{ marginBottom: 14 }}>{error}</div> : null}

      <SectionTabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === "generate" ? (
        <>
          {/* ── Card 1: Select Client ── */}
          <div className="invoice-mobile-card">
            <h2 className="invoice-mobile-card__title">Select Client</h2>

            {/* Search input */}
            <div className="invoice-mobile-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search client by name or code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Client List */}
            {loadingCustomers ? (
              <div style={{ padding: "16px 0", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>Loading clients...</div>
            ) : filteredCustomers.length === 0 ? (
              <div style={{ padding: "16px 0", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>No clients found</div>
            ) : (
              <div className="invoice-mobile-client-list">
                {filteredCustomers.map((customer, idx) => {
                  const isSelected = customer._id === selectedClientId;
                  const avatarStyle = getAvatarStyle(idx);
                  const initials = getInitials(customer.fullName);

                  return (
                    <div
                      key={customer._id}
                      className={`invoice-mobile-client-item ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedClientId(customer._id)}
                    >
                      <div className="invoice-mobile-client-left">
                        <div className={`invoice-mobile-checkbox ${isSelected ? "is-checked" : ""}`}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>

                        <div className="invoice-mobile-avatar" style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.color }}>
                          {initials}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>{customer.fullName}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{customer.idCode || customer.clientCode}</div>
                        </div>
                      </div>

                      <div className={`invoice-mobile-checkbox ${isSelected ? "is-checked" : ""}`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button type="button" className="invoice-mobile-add-btn" onClick={() => navigate("/broker/customers")}>
              + Add New Client
            </button>
          </div>

          {/* ── Card 2: Select Date Range ── */}
          <div className="invoice-mobile-card">
            <h2 className="invoice-mobile-card__title">Select Date Range</h2>

            <div className="invoice-mobile-date-grid">
              <div className="invoice-mobile-date-field">
                <label>From Date</label>
                <div className="invoice-mobile-date-input">
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => {
                      setFilters({ ...filters, fromDate: e.target.value });
                      setQuickSelect("custom");
                    }}
                  />
                </div>
              </div>

              <div className="invoice-mobile-date-field">
                <label>To Date</label>
                <div className="invoice-mobile-date-input">
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => {
                      setFilters({ ...filters, toDate: e.target.value });
                      setQuickSelect("custom");
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Quick Select</div>

            <div className="invoice-mobile-quick-pills">
              {[
                { key: "today", label: "Today" },
                { key: "this_week", label: "This Week" },
                { key: "this_month", label: "This Month" },
                { key: "last_month", label: "Last Month" },
                { key: "custom", label: "Custom" },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  className={`invoice-mobile-pill ${quickSelect === pill.key ? "is-active" : ""}`}
                  onClick={() => handleQuickSelect(pill.key)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Card 3: Invoice Format ── */}
          <div className="invoice-mobile-card">
            <h2 className="invoice-mobile-card__title">Invoice Format</h2>

            <div className="invoice-mobile-format-toggle">
              <button
                type="button"
                className={`invoice-mobile-format-btn ${invoiceFormat === "pdf" ? "is-active" : ""}`}
                onClick={() => setInvoiceFormat("pdf")}
              >
                PDF
              </button>
              <button
                type="button"
                className={`invoice-mobile-format-btn ${invoiceFormat === "excel" ? "is-active" : ""}`}
                onClick={() => setInvoiceFormat("excel")}
              >
                Excel
              </button>
            </div>
          </div>

          {/* ── Optional Collapsible PDF Element Visibility Controls ── */}
          <div className="invoice-mobile-card" style={{ padding: "12px 18px" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowTogglesPanel(!showTogglesPanel)}
            >
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>Advanced Visibility Controls</span>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>{showTogglesPanel ? "Hide" : "Show"}</span>
            </div>

            {showTogglesPanel && (
              <div style={{ marginTop: 12, display: "grid", gap: 10, fontSize: "0.85rem" }}>
                {[
                  { key: "showChargesBreakup", label: "Show Charges Breakup Box" },
                  { key: "showTaxSummary", label: "Show Tax Summary Box" },
                  { key: "showClientContact", label: "Show Client Address & Contact Info" },
                  { key: "showStamp", label: "Show Official Stamp / Seal" },
                  { key: "showFooterNotes", label: "Show Footer Notes & Market Insights" },
                ].map((item) => (
                  <label key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(toggles[item.key])}
                      onChange={(e) => handleToggleChange(item.key, e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: "#0066ff" }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Primary Download CTA Button ── */}
          <button
            type="button"
            className="invoice-mobile-download-btn"
            disabled={!selectedClientId || loadingAction}
            onClick={handleDownloadInvoice}
          >
            {loadingAction ? "Generating Invoice..." : "Download Invoice"}
          </button>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "#0066ff", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}
              onClick={handlePreview}
            >
              Preview On Screen
            </button>
          </div>
        </>
      ) : null}

      {/* ── Preview Tab ── */}
      {activeTab === "preview" ? (
        <section style={{ marginTop: 16 }}>
          {invoiceData ? (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <button className="invoice-mobile-download-btn" style={{ height: 42, fontSize: "0.88rem" }} type="button" onClick={handleDownloadInvoice}>
                  Download {invoiceFormat.toUpperCase()}
                </button>
                <button
                  type="button"
                  style={{ padding: "0 16px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: 600, fontSize: "0.85rem" }}
                  onClick={() => setActiveTab("trades")}
                >
                  View trades
                </button>
              </div>

              <div style={{ overflowX: "auto", width: "100%", paddingBottom: 10 }}>
                <BrokerInvoicePreview
                  broker={invoiceData.broker}
                  client={invoiceData.client}
                  trades={invoiceData.trades}
                  filters={invoiceData.filters}
                  summary={invoiceData.summary}
                  statementNumber={statementNumber}
                  toggles={toggles}
                />
              </div>
            </>
          ) : (
            <EmptyState title="No preview available" />
          )}
        </section>
      ) : null}

      {/* ── Included Trades Tab ── */}
      {activeTab === "trades" ? (
        <section style={{ marginTop: 16 }}>
          {!invoiceData ? (
            <EmptyState title="No trades generated yet" />
          ) : invoiceData.trades.length ? (
            <div className="mobile-entity-list">
              {invoiceData.trades.map((trade) => (
                <article key={trade._id} className="mobile-entity-card">
                  <div className="mobile-entity-card__header">
                    <div>
                      <strong>{trade.stockName || trade.symbol}</strong>
                      <span>{formatDate(trade.tradedAt)} · {String(trade.side).toUpperCase()}</span>
                    </div>
                    <strong className={trade.netPnL >= 0 ? "text-success" : "text-danger"}>{formatRupee(trade.netPnL)}</strong>
                  </div>

                  <div className="mobile-entity-card__meta">
                    <div>
                      <span>Qty</span>
                      <strong>{Number(trade.quantity || 1) * Number(trade.lotSize || 1)}</strong>
                    </div>
                    <div>
                      <span>Buy</span>
                      <strong>{formatAmount(trade.buyPrice ?? trade.entryPrice)}</strong>
                    </div>
                    <div>
                      <span>Sell</span>
                      <strong>{formatAmount(trade.sellPrice ?? trade.exitPrice)}</strong>
                    </div>
                    <div>
                      <span>Charges</span>
                      <strong>{formatAmount(trade.charges?.total)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No trades found in this period" />
          )}
        </section>
      ) : null}
    </section>
  );
}
