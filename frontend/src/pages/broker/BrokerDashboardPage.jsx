import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { brokerApi } from "../../api/client";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { ACCOUNT_ROUTES } from "../../constants/accessConfig";
import { initialsFromName } from "../../utils/formatters";

// ── Icons ────────────────────────────────────────────────
const AddUserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const TradeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <rect x="16" y="6" width="4" height="8" rx="1" fill="currentColor" />
    <rect x="10" y="8" width="4" height="8" rx="1" fill="currentColor" />
    <rect x="4" y="10" width="4" height="6" rx="1" fill="currentColor" />
  </svg>
);

const InvoiceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const KycIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const SwitchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MoreVerticalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

// ── Client Switcher Bottom Sheet Modal ────────────────────
function ClientSwitcherModal({ clients, selectedId, onSelect, onClose }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return clients.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.clientCode?.toLowerCase().includes(q) ||
        c.idCode?.toLowerCase().includes(q)
    );
  }, [clients, query]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: "var(--bp-surface)",
          borderRadius: "20px 20px 0 0",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "var(--bp-shadow-lg)",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          overscrollBehaviorY: "contain",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Bar */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--bp-border)", margin: "10px auto 4px" }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            borderBottom: "1px solid var(--bp-border)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            Select Account
          </h2>
          <button type="button" className="bp-icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--bp-border)", background: "var(--bp-surface2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: 12, padding: "10px 14px" }}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Search name or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: "0.92rem", color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}
              autoFocus
            />
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "8px 12px 16px" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "30px 24px", textAlign: "center", color: "var(--bp-muted)" }}>
              <p style={{ margin: 0 }}>No clients found</p>
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
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: isSel ? "1.5px solid var(--bp-blue)" : "1px solid transparent",
                  background: isSel ? "var(--bp-blue-soft)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  margin: "4px 0",
                  transition: "background 0.12s",
                }}
                onClick={() => { onSelect(client); onClose(); }}
              >
                <div className="bp-avatar bp-avatar--sm" style={{ background: "var(--bp-blue)", flexShrink: 0 }}>
                  {initialsFromName(client.fullName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "0.92rem", fontWeight: 600, color: "var(--bp-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {client.fullName}
                  </span>
                  <span style={{ display: "block", fontSize: "0.78rem", color: "var(--bp-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {client.clientCode} · {client.idCode}
                  </span>
                </div>
                {isSel && (
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--bp-blue)", flexShrink: 0 }}>
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function BrokerDashboardPage() {
  const navigate = useNavigate();
  const { selectedClient, setSelectedClient } = useBrokerAuth();

  const [clients, setClients] = useState([]);
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Load clients
  useEffect(() => {
    async function load() {
      try {
        const clRes = await brokerApi.get("/api/broker-portal/clients");
        const clientList = clRes.data?.clients || clRes.data || [];
        setClients(clientList);
        if (clientList.length > 0 && !selectedClient) {
          setSelectedClient(clientList[0]);
        }
      } catch {
        // silent load
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quickActions = useMemo(() => [
    {
      key: "add-client",
      icon: <AddUserIcon />,
      title: "New Client Add",
      sub: "Add a new client",
      onClick: () => navigate(ACCOUNT_ROUTES.customers, { state: { activeTab: "create" } }),
    },
    {
      key: "new-trade",
      icon: <TradeIcon />,
      title: "New Trade",
      sub: "Place a new trade",
      onClick: () => navigate("/account/trades/new"),
    },
    {
      key: "invoice",
      icon: <InvoiceIcon />,
      title: "Invoice",
      sub: "View and manage invoices",
      onClick: () => navigate(ACCOUNT_ROUTES.invoice),
    },
    {
      key: "kyc",
      icon: <KycIcon />,
      title: "KYC",
      sub: "Manage KYC details",
      onClick: () => navigate(ACCOUNT_ROUTES.customers),
    },
    {
      key: "switch",
      icon: <SwitchIcon />,
      title: "Switch Account",
      sub: "Switch to another account",
      onClick: () => setShowSwitcher(true),
    },
  ], [navigate]);

  return (
    <div style={{ background: "var(--bp-bg)", minHeight: "100vh", width: "100%", maxWidth: "100%", overflowX: "hidden", paddingBottom: "calc(var(--bp-nav-h) + 16px)", boxSizing: "border-box" }}>
      {/* ── Sticky Top Header ── */}
      <div className="bp-page-header" style={{ padding: "14px 16px" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
          Watchlist
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" className="bp-icon-btn" aria-label="Search">
            <SearchIcon />
          </button>
          <button type="button" className="bp-icon-btn" aria-label="Menu">
            <MoreVerticalIcon />
          </button>
        </div>
      </div>

      {/* ── Active Client Banner Card ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <button
          type="button"
          onClick={() => setShowSwitcher(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "14px 16px",
            background: "var(--bp-surface)",
            border: "1px solid var(--bp-border)",
            borderRadius: "var(--bp-radius-lg)",
            boxShadow: "var(--bp-shadow)",
            cursor: "pointer",
            textAlign: "left",
            boxSizing: "border-box",
          }}
          id="bp-client-switcher-btn"
        >
          <div
            className="bp-avatar bp-avatar--lg"
            style={{
              background: "var(--bp-blue)",
              width: 48,
              height: 48,
              fontSize: "1.1rem",
              flexShrink: 0,
            }}
          >
            {selectedClient ? initialsFromName(selectedClient.fullName) : "–"}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--bp-text)",
                fontFamily: "Inter, sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedClient?.fullName || "Select a client"}
            </span>
            <span
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--bp-muted)",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedClient ? (selectedClient.clientCode || selectedClient.idCode) : "Tap to switch account"}
            </span>
          </div>

          <div style={{ color: "var(--bp-muted2)", flexShrink: 0 }}>
            <ChevronDown />
          </div>
        </button>
      </div>

      {/* ── Quick Actions Section Title ── */}
      <p
        style={{
          margin: "18px 16px 8px",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--bp-muted)",
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.02em",
        }}
      >
        Quick Actions
      </p>

      {/* ── Quick Actions Cards Stack ── */}
      <div style={{ padding: "0 16px", display: "grid", gap: 10 }}>
        {quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "14px 16px",
              background: "var(--bp-surface)",
              border: "1px solid var(--bp-border)",
              borderRadius: "var(--bp-radius-lg)",
              boxShadow: "var(--bp-shadow)",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.12s",
              boxSizing: "border-box",
            }}
            id={`bp-action-${action.key}`}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--bp-blue-soft)",
                color: "var(--bp-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {action.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: "var(--bp-text)",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {action.title}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  color: "var(--bp-muted)",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {action.sub}
              </span>
            </div>

            <div style={{ color: "var(--bp-muted2)", flexShrink: 0 }}>
              <ChevronRight />
            </div>
          </button>
        ))}
      </div>

      {/* ── Client Switcher Modal ── */}
      {showSwitcher && (
        <ClientSwitcherModal
          clients={clients}
          selectedId={selectedClient?._id}
          onSelect={setSelectedClient}
          onClose={() => setShowSwitcher(false)}
        />
      )}
    </div>
  );
}
