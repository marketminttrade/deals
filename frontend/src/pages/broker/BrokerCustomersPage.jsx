import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { brokerApi } from "../../api/client";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { downloadCustomerKycPdf } from "../../utils/kycPdf";
import { resolveAssetUrl } from "../../utils/assets";
import { formatDate } from "../../utils/formatters";
import NewClientAddWizard from "../../components/kyc/NewClientAddWizard";
import KycDetailsView from "../../components/kyc/KycDetailsView";
import { kycStatusLabel } from "../../utils/clientKyc";

// ── Constants ─────────────────────────────────────────────
const initialForm = {
  fullName: "", clientCode: "", phone: "", email: "", address: "",
};

const initialKycForm = {
  firstName: "", lastName: "", fatherName: "", phone: "", email: "",
  address: "", dateOfBirth: "", gender: "",
  applicationDate: new Date().toISOString().slice(0, 10),
  initialDeposit: "", aadhaarNumber: "", panNumber: "",
};

function splitFullName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

function buildKycFormFromCustomer(customer) {
  const kyc = customer?.kyc || {};
  const fb = splitFullName(customer?.fullName || "");
  return {
    firstName: kyc.firstName || fb.firstName || "",
    lastName: kyc.lastName || fb.lastName || "",
    fatherName: kyc.fatherName || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    dateOfBirth: kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toISOString().slice(0, 10) : "",
    gender: kyc.gender || "",
    applicationDate: kyc.applicationDate ? new Date(kyc.applicationDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    initialDeposit: kyc.initialDeposit ?? "",
    aadhaarNumber: kyc.aadhaarNumber || "",
    panNumber: kyc.panNumber || "",
  };
}

function maskNumber(str = "", visibleCount = 4) {
  if (!str) return "•••• •••• ••••";
  const clean = str.replace(/\s+/g, "");
  if (clean.length <= visibleCount) return clean;
  const maskedPart = "X".repeat(clean.length - visibleCount);
  const visible = clean.slice(-visibleCount);
  return (maskedPart + visible).replace(/(.{4})/g, "$1 ").trim();
}

// ── Icons ─────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);

const ShieldIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
);

const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const ServerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
);

const UserLockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><rect x="15" y="11" width="6" height="5" rx="1"/><path d="M17 11V9.5a1.5 1.5 0 0 1 3 0V11"/></svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const DocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

const QuestionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

// ── KYC Security & Documents Screen (Matching KYC.jpeg) ───────────────────────
function KycSecurityScreen({ customers, selectedCustomer, onSelectCustomer, onNavigateToForm, onDownloadPdf, onAddNew }) {
  return (
    <div style={{ padding: "12px", display: "grid", gap: 12 }}>
      {/* Active Customer Selector Dropdown */}
      {customers.length > 0 && (
        <div style={{ background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", padding: "12px 16px", boxShadow: "var(--bp-shadow)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>Active Client</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
              {selectedCustomer?.fullName || "Select Client"}
            </span>
          </div>
          <select
            value={selectedCustomer?._id || ""}
            onChange={(e) => {
              const found = customers.find((c) => c._id === e.target.value);
              if (found) onSelectCustomer(found);
            }}
            style={{ border: "1px solid var(--bp-border)", borderRadius: 10, padding: "8px 12px", fontSize: "0.85rem", fontWeight: 600, color: "var(--bp-blue)", outline: "none", background: "var(--bp-blue-soft)" }}
          >
            {customers.map((c) => (
              <option key={c._id} value={c._id}>{c.fullName} ({c.clientCode || c.idCode})</option>
            ))}
          </select>
        </div>
      )}

      {/* Card 1: Your Information is Secure */}
      <div style={{ background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", padding: "20px 16px 16px", boxShadow: "var(--bp-shadow)" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bp-blue-soft)", color: "var(--bp-blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldIcon />
          </div>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
              Your Information is Secure
            </h3>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--bp-muted)", lineHeight: "1.45" }}>
              We use bank-level security to protect your personal information and documents.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { icon: <LockIcon />, title: "256-bit Encryption", sub: "All data is encrypted and secured" },
            { icon: <ServerIcon />, title: "Secure Storage", sub: "Documents are stored in secure servers" },
            { icon: <UserLockIcon />, title: "Access Control", sub: "Only you can access your information" },
          ].map((item) => (
            <div key={item.title} style={{ padding: "10px 8px", background: "var(--bp-surface2)", borderRadius: 12, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {item.icon}
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>{item.title}</span>
              <span style={{ fontSize: "0.6rem", color: "var(--bp-muted)", lineHeight: "1.3" }}>{item.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Download Your KYC Form */}
      <div style={{ background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", padding: "20px 16px", boxShadow: "var(--bp-shadow)" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
          Download Your KYC Form
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--bp-muted)", lineHeight: "1.45" }}>
          You can download your complete KYC form in PDF format for your records or for any offline verification.
        </p>

        {/* PDF Illustration */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{ position: "relative", width: 90, height: 110 }}>
            <div style={{ width: 80, height: 100, border: "1.5px solid var(--bp-border)", borderRadius: 10, background: "var(--bp-surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "var(--bp-shadow)" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--bp-red)", fontFamily: "Inter, sans-serif" }}>KYC</span>
              <div style={{ width: 44, height: 22, borderRadius: 6, background: "var(--bp-red-soft)", color: "var(--bp-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800 }}>PDF</div>
            </div>
            <div style={{ position: "absolute", top: 10, right: 0, width: 32, height: 32, borderRadius: "50%", background: "var(--bp-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DownloadIcon />
            </div>
          </div>
        </div>

        <button type="button" className="bp-btn-full" onClick={onDownloadPdf} id="bp-download-kyc-pdf-btn">
          <DownloadIcon /> Download Your KYC Form (PDF)
        </button>

        {/* What's included box */}
        <div style={{ marginTop: 14, padding: "14px 16px", background: "var(--bp-blue-soft)", border: "1px solid var(--bp-blue-mid)", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", fontWeight: 700, color: "var(--bp-blue)", marginBottom: 10 }}>
            <DocIcon /> What's included in this PDF?
          </div>
          {[
            "Personal & Contact Details",
            "KYC Documents (ID, Address, PAN)",
            "Bank Details",
            "Nominee Details",
            "Declaration & Signature",
          ].map((inc) => (
            <div key={inc} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--bp-text)", margin: "5px 0" }}>
              <CheckIcon /> <span>{inc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 1: KYC Form Details */}
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px",
          background: "var(--bp-surface)",
          border: "1px solid var(--bp-border)",
          borderRadius: "var(--bp-radius-lg)",
          boxShadow: "var(--bp-shadow)",
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
        }}
        onClick={onNavigateToForm}
        id="bp-kyc-form-details-row"
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--bp-blue-soft)", color: "var(--bp-blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DocIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 600, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
            KYC Form Details
          </span>
          <span style={{ display: "block", fontSize: "0.8rem", color: "var(--bp-muted)", marginTop: 2 }}>
            View details of your KYC form
          </span>
        </div>
        <ChevronRight />
      </button>

      {/* Add New Client Button */}
      <button type="button" className="bp-btn-outline" style={{ marginTop: 8 }} onClick={onAddNew} id="bp-add-new-client-btn">
        <AddIcon /> Register New Client
      </button>
    </div>
  );
}

// ── Verified Documents Viewer Screen (Matching KYC-Details.jpeg) ─────────────
// eslint-disable-next-line no-unused-vars
function KycVerifiedDetailsScreen({ customer, onBack }) {
  const [openSection, setOpenSection] = useState("identity");
  const [viewImageModal, setViewImageModal] = useState(null);

  const kyc = customer?.kyc || {};
  const aadhaarFrontUrl = resolveAssetUrl(kyc.aadhaarFrontUrl);
  const panImageUrl = resolveAssetUrl(kyc.panImageUrl);

  return (
    <div style={{ padding: "12px", display: "grid", gap: 12 }}>
      {/* Header Bar */}
      <div className="bp-page-header" style={{ padding: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" className="bp-drawer-back" onClick={onBack} aria-label="Back"><BackIcon /></button>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, fontFamily: "Inter, sans-serif" }}>KYC Details</h1>
        </div>
        <button type="button" className="bp-icon-btn"><QuestionIcon /></button>
      </div>

      {/* Status Card */}
      <div style={{ background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", padding: "16px", boxShadow: "var(--bp-shadow)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bp-green-soft)", color: "var(--bp-green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShieldIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block" }}>KYC Status</span>
            <span className="bp-badge bp-badge--active">Active</span>
          </div>
          <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--bp-green)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 2 }}>
            Verified
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block", marginTop: 3 }}>
            Last updated on {formatDate(kyc.generatedAt || new Date())}
          </span>
        </div>
      </div>

      {/* Accordion 1: Identity Proof */}
      <div className="bp-doc-accordion">
        <div className={`bp-doc-accordion-header ${openSection === "identity" ? "is-open" : ""}`} onClick={() => setOpenSection(openSection === "identity" ? "" : "identity")}>
          <div className="bp-doc-accordion-left">
            <div className="bp-doc-accordion-icon"><UserIcon /></div>
            <span className="bp-doc-accordion-title">Identity Proof</span>
          </div>
          <div className="bp-doc-accordion-right">
            <span className="bp-badge bp-badge--verified">Verified</span>
            <ChevronDown />
          </div>
        </div>
        {openSection === "identity" && (
          <div className="bp-doc-accordion-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 14, alignItems: "start" }}>
              <div>
                <div className="bp-doc-field">
                  <span className="bp-doc-field-label">Document Type</span>
                  <span className="bp-doc-field-value">Aadhaar Card</span>
                </div>
                <div className="bp-doc-field">
                  <span className="bp-doc-field-label">Aadhaar Number</span>
                  <span className="bp-doc-field-value">{maskNumber(kyc.aadhaarNumber || "1234")}</span>
                </div>
                <div className="bp-doc-field">
                  <span className="bp-doc-field-label">Name</span>
                  <span className="bp-doc-field-value">{customer.fullName}</span>
                </div>
                <div className="bp-doc-field">
                  <span className="bp-doc-field-label">Issue Date</span>
                  <span className="bp-doc-field-value">12 Jan 2018</span>
                </div>
              </div>
              <div>
                {aadhaarFrontUrl ? (
                  <img src={aadhaarFrontUrl} alt="Aadhaar Card" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--bp-border)" }} />
                ) : (
                  <div style={{ width: "100%", height: 80, borderRadius: 8, border: "1px solid var(--bp-border)", background: "var(--bp-surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", color: "var(--bp-muted)" }}>Aadhaar Card</div>
                )}
                <button type="button" className="bp-doc-view-btn" style={{ marginTop: 8 }} onClick={() => aadhaarFrontUrl && setViewImageModal(aadhaarFrontUrl)}>
                  <EyeIcon /> View Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 2: Address Proof */}
      <div className="bp-doc-accordion">
        <div className={`bp-doc-accordion-header ${openSection === "address" ? "is-open" : ""}`} onClick={() => setOpenSection(openSection === "address" ? "" : "address")}>
          <div className="bp-doc-accordion-left">
            <div className="bp-doc-accordion-icon"><HomeIcon /></div>
            <span className="bp-doc-accordion-title">Address Proof</span>
          </div>
          <div className="bp-doc-accordion-right">
            <span className="bp-badge bp-badge--verified">Verified</span>
            <ChevronDown />
          </div>
        </div>
        {openSection === "address" && (
          <div className="bp-doc-accordion-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 14, alignItems: "start" }}>
              <div>
                <div className="bp-doc-field">
                  <span className="bp-doc-field-label">Document Type</span>
                  <span className="bp-doc-field-value">Aadhaar Card</span>
                </div>
                <div className="bp-doc-field">
                  <span className="bp-doc-field-label">Address</span>
                  <span className="bp-doc-field-value" style={{ fontSize: "0.82rem", lineHeight: "1.4" }}>
                    {customer.address || "B/102, Shreeji Residency, Vastral, Ahmedabad, Gujarat - 382418"}
                  </span>
                </div>
              </div>
              <div>
                {aadhaarFrontUrl ? (
                  <img src={aadhaarFrontUrl} alt="Address Proof" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--bp-border)" }} />
                ) : (
                  <div style={{ width: "100%", height: 80, borderRadius: 8, border: "1px solid var(--bp-border)", background: "var(--bp-surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", color: "var(--bp-muted)" }}>Address Card</div>
                )}
                <button type="button" className="bp-doc-view-btn" style={{ marginTop: 8 }} onClick={() => aadhaarFrontUrl && setViewImageModal(aadhaarFrontUrl)}>
                  <EyeIcon /> View Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 3: PAN Proof */}
      <div className="bp-doc-accordion">
        <div className={`bp-doc-accordion-header ${openSection === "pan" ? "is-open" : ""}`} onClick={() => setOpenSection(openSection === "pan" ? "" : "pan")}>
          <div className="bp-doc-accordion-left">
            <div className="bp-doc-accordion-icon"><DocIcon /></div>
            <span className="bp-doc-accordion-title">PAN Proof</span>
          </div>
          <div className="bp-doc-accordion-right">
            <span className="bp-badge bp-badge--verified">Verified</span>
            <ChevronDown />
          </div>
        </div>
        {openSection === "pan" && (
          <div className="bp-doc-accordion-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 14, alignItems: "start" }}>
              <div>
                <div className="bp-doc-field">
                  <span className="bp-doc-field-label">PAN Number</span>
                  <span className="bp-doc-field-value">{kyc.panNumber || "ABCDE1234F"}</span>
                </div>
                <div className="bp-doc-field">
                  <span className="bp-doc-field-label">Name as per PAN</span>
                  <span className="bp-doc-field-value">{customer.fullName?.toUpperCase()}</span>
                </div>
              </div>
              <div>
                {panImageUrl ? (
                  <img src={panImageUrl} alt="PAN Card" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--bp-border)" }} />
                ) : (
                  <div style={{ width: "100%", height: 80, borderRadius: 8, border: "1px solid var(--bp-border)", background: "var(--bp-surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", color: "var(--bp-muted)" }}>PAN Card</div>
                )}
                <button type="button" className="bp-doc-view-btn" style={{ marginTop: 8 }} onClick={() => panImageUrl && setViewImageModal(panImageUrl)}>
                  <EyeIcon /> View Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Preview Modal */}
      {viewImageModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewImageModal(null)}>
          <div style={{ position: "relative", maxWidth: "100%", maxHeight: "90vh" }}>
            <img src={viewImageModal} alt="Document Full View" style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }} />
            <button type="button" style={{ position: "absolute", top: -40, right: 0, color: "#fff", background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer" }} onClick={() => setViewImageModal(null)}>
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KYC Form Details Screen (Matching KYC-fillup.jpeg) ────────────────────────
function KycFormSummaryScreen({ customer = {}, kycForm, onBack, onOpenEdit }) {
  const kyc = customer?.kyc || {};

  return (
    <div style={{ padding: "12px", display: "grid", gap: 12 }}>
      {/* Header Bar */}
      <div className="bp-page-header" style={{ padding: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" className="bp-drawer-back" onClick={onBack} aria-label="Back"><BackIcon /></button>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, fontFamily: "Inter, sans-serif" }}>KYC Form Details</h1>
        </div>
        <button type="button" className="bp-icon-btn"><QuestionIcon /></button>
      </div>

      {/* Form Summary Card */}
      <div style={{ background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", padding: "16px", boxShadow: "var(--bp-shadow)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--bp-blue-soft)", color: "var(--bp-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DocIcon />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>Form Summary</h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--bp-muted)" }}>Here is the summary of your KYC Form and submitted documents.</p>
            </div>
          </div>
          <span className={`bp-badge ${kyc.status && kyc.status !== "incomplete" ? "bp-badge--verified" : "bp-badge--inactive"}`}>{kycStatusLabel(kyc.status)}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 12, borderTop: "1px solid var(--bp-border)" }}>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>KYC Form Number</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 2 }}>
              {kyc.referenceNumber || "Not generated"}
            </span>
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>Client ID</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 2 }}>
              {customer.clientCode || customer.idCode || "–"}
            </span>
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>Submitted On</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--bp-text)", display: "block", marginTop: 2 }}>
              {kyc.submittedAt ? formatDate(kyc.submittedAt) : "–"}
            </span>
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>KYC Status</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--bp-green)", display: "block", marginTop: 2 }}>
              {kycStatusLabel(kyc.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Accordion: Personal Information */}
      <div className="bp-doc-accordion">
        <div className="bp-doc-accordion-header is-open">
          <div className="bp-doc-accordion-left">
            <div className="bp-doc-accordion-icon"><UserIcon /></div>
            <span className="bp-doc-accordion-title">Personal Information</span>
          </div>
          <ChevronDown />
        </div>
        <div className="bp-doc-accordion-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span className="bp-doc-field-label">Full Name</span>
              <span className="bp-doc-field-value">{customer.fullName}</span>
            </div>
            <div>
              <span className="bp-doc-field-label">Date of Birth</span>
              <span className="bp-doc-field-value">{kyc.dateOfBirth ? formatDate(kyc.dateOfBirth) : "–"}</span>
            </div>
            <div>
              <span className="bp-doc-field-label">Email ID</span>
              <span className="bp-doc-field-value" style={{ fontSize: "0.82rem" }}>{customer.email || "–"}</span>
            </div>
            <div>
              <span className="bp-doc-field-label">Mobile Number</span>
              <span className="bp-doc-field-value">{customer.phone || "–"}</span>
            </div>
            <div>
              <span className="bp-doc-field-label">PAN Number</span>
              <span className="bp-doc-field-value">{kyc.panNumber || "–"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion: Address Details */}
      <div className="bp-doc-accordion">
        <div className="bp-doc-accordion-header is-open">
          <div className="bp-doc-accordion-left">
            <div className="bp-doc-accordion-icon"><HomeIcon /></div>
            <span className="bp-doc-accordion-title">Address Details</span>
          </div>
          <ChevronDown />
        </div>
        <div className="bp-doc-accordion-body">
          <div>
            <span className="bp-doc-field-label">Address</span>
            <span className="bp-doc-field-value" style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
              {customer.address || "–"}
            </span>
          </div>
        </div>
      </div>

      {/* Accordion: Documents Submitted */}
      <div className="bp-doc-accordion">
        <div className="bp-doc-accordion-header is-open">
          <div className="bp-doc-accordion-left">
            <div className="bp-doc-accordion-icon"><DocIcon /></div>
            <span className="bp-doc-accordion-title">Documents Submitted</span>
          </div>
          <ChevronDown />
        </div>
        <div className="bp-doc-accordion-body" style={{ padding: "8px 16px" }}>
          {[
            { title: "Aadhaar Front", sub: maskNumber(kyc.aadhaarNumber), uploaded: kyc.aadhaarFrontUrl },
            { title: "Aadhaar Back", sub: maskNumber(kyc.aadhaarNumber), uploaded: kyc.aadhaarBackUrl },
            { title: "PAN Proof", sub: kyc.panNumber || "–", uploaded: kyc.panImageUrl },
            { title: "Bank Proof", sub: kyc.bankName || "–", uploaded: kyc.bankProofUrl },
            { title: "Photo", sub: "Customer photograph", uploaded: kyc.customerPhotoUrl },
            { title: "Signature", sub: "Customer signature", uploaded: kyc.customerSignatureUrl },
          ].map((item) => (
            <div key={item.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--bp-border)" }}>
              <div>
                <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block" }}>{item.title}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--bp-muted)", display: "block", marginTop: 2 }}>{item.sub}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`bp-badge ${item.uploaded ? "bp-badge--verified" : "bp-badge--inactive"}`}>{item.uploaded ? "Uploaded" : "Pending"}</span>
                <ChevronRight />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Need to Update Something? */}
      <div style={{ background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", padding: "16px", boxShadow: "var(--bp-shadow)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block" }}>Need to Update Something?</span>
          <span style={{ fontSize: "0.78rem", color: "var(--bp-muted)", display: "block", marginTop: 2 }}>If your KYC details are outdated, you can update them from the profile section.</span>
        </div>
        <button type="button" className="bp-btn-outline" style={{ padding: "8px 12px", fontSize: "0.8rem", flexShrink: 0 }} onClick={onOpenEdit}>
          Update KYC
        </button>
      </div>
    </div>
  );
}

// ── New Client Sheet Form ────────────────────────────────────
function NewClientSheet({ form, setForm, saving, onSubmit, onClose, isEditing, error }) {
  return (
    <>
      <div className="bp-drawer-overlay" onClick={() => !saving && onClose()} />
      <div className="bp-drawer" role="dialog" aria-modal="true" aria-label={isEditing ? "Edit Client" : "Add New Client"}>
        <div className="bp-drawer-handle" />
        <div className="bp-drawer-header">
          <button type="button" className="bp-drawer-back" disabled={saving} onClick={onClose} aria-label="Close client form"><BackIcon /></button>
          <div className="bp-drawer-title">
            <h2>{isEditing ? "Edit Client" : "Add New Client"}</h2>
            <p>{isEditing ? "Update client information" : "Register a new client"}</p>
          </div>
        </div>
        <form onSubmit={onSubmit} id="bp-client-form">
          {error && <p role="alert" style={{ padding: "0 16px", color: "var(--bp-red)" }}>{error}</p>}
          {!isEditing && <p style={{ padding: "0 16px", fontSize: 13 }}>KYC documents can be added later.</p>}
          <div className="bp-form">
            <div>
              <label className="bp-form-label" htmlFor="client-full-name">Full Name</label>
              <input id="client-full-name" className="bp-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <label className="bp-form-label" htmlFor="client-code">Client Code</label>
              <input id="client-code" className="bp-input" value={form.clientCode} onChange={(e) => setForm({ ...form, clientCode: e.target.value.toUpperCase() })} required />
            </div>
            <div className="bp-form-row">
              <div>
                <label className="bp-form-label">Mobile</label>
                <input className="bp-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="bp-form-label">Email</label>
                <input className="bp-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="bp-form-label">Address</label>
              <textarea className="bp-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} style={{ resize: "vertical" }} />
            </div>
          </div>
          <div className="bp-drawer-footer">
            {isEditing && <button type="button" className="bp-btn-outline" onClick={onClose}>Cancel</button>}
            <button type="submit" className="bp-btn-solid" style={!isEditing ? { gridColumn: "span 2" } : {}} disabled={saving} id="bp-save-client-btn">
              {saving ? "Saving..." : isEditing ? "Update Client" : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function BrokerCustomersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedClient, setSelectedClient } = useBrokerAuth();

  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [kycForm, setKycForm] = useState(initialKycForm);
  const [editingCustomerId, setEditingCustomerId] = useState("");
  const [kycPreview, setKycPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [wizardCustomer, setWizardCustomer] = useState(null);

  // subScreen: "security" (KYC.jpeg) | "details" (KYC-Details.jpeg) | "form-summary" (KYC-fillup.jpeg)
  const [subScreen, setSubScreen] = useState("security");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await brokerApi.get("/api/broker-portal/clients");
      const list = res.data?.clients || res.data || [];
      setCustomers(list);
      if (list.length > 0 && !selectedClient) {
        setSelectedClient(list[0]);
      }
      setError("");
    } catch (err) {
      setCustomers([]);
      setError(err.response?.data?.message || "Unable to load clients.");
    } finally {
      setLoading(false);
    }
  }, [selectedClient, setSelectedClient]);

  const loadKycPreview = useCallback(async (clientId) => {
    if (!clientId) { setKycPreview(null); return; }
    try {
      const res = await brokerApi.get(`/api/broker-portal/clients/${clientId}/kyc-preview`);
      setKycPreview(res.data);
    } catch {
      setKycPreview(null);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  useEffect(() => {
    if (location.state?.activeTab === "create") {
      setEditingCustomerId("");
      setForm(initialForm);
      setShowClientForm(true);
      setSubScreen("security");
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    setKycPreview(null);
    if (selectedClient) {
      setKycForm(buildKycFormFromCustomer(selectedClient));
      loadKycPreview(selectedClient._id);
    }
  }, [selectedClient, loadKycPreview]);

  const closeForm = () => {
    setShowClientForm(false);
    setEditingCustomerId("");
    setForm(initialForm);
    setError("");
  };

  const openClientForm = (customer = null) => {
    setEditingCustomerId(customer?._id || "");
    setForm(customer ? Object.fromEntries(Object.keys(initialForm).map((key) => [key, customer[key] || (key === "clientCode" ? customer.idCode : "") || ""])) : { ...initialForm });
    setError("");
    setMessage("");
    setShowClientForm(true);
  };

  const openKyc = (customer = null) => {
    setWizardCustomer(customer);
    setError("");
    setMessage("");
    setSubScreen("wizard");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.fullName.trim() || !form.clientCode.trim()) {
      setError("Full name and client code are required.");
      return;
    }
    setSaving(true); setError(""); setMessage("");
    const clientCode = form.clientCode.trim().toUpperCase();
    const payload = { ...form, fullName: form.fullName.trim(), idCode: clientCode, clientCode };
    try {
      let saved;
      if (editingCustomerId) {
        const res = await brokerApi.patch(`/api/broker-portal/clients/${editingCustomerId}`, payload);
        saved = res.data;
        setMessage("Client updated.");
      } else {
        const res = await brokerApi.post("/api/broker-portal/clients", payload);
        saved = res.data;
        setMessage("Client created.");
      }
      closeForm();
      await loadCustomers();
      if (saved?._id) setSelectedClient(saved);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save client.");
    } finally {
      setSaving(false);
    }
  }

  const handleDownloadPdf = () => {
    if (kycPreview) {
      downloadCustomerKycPdf(kycPreview);
    } else {
      setMessage("Preparing PDF download...");
      if (selectedClient?._id) loadKycPreview(selectedClient._id);
    }
  };

  return (
    <div style={{ background: "var(--bp-bg)", minHeight: "100vh", paddingBottom: 80 }}>
      {/* ── Top Header (shown on security overview screen) ── */}
      {subScreen === "security" && (
        <div className="bp-page-header">
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
            KYC Security & Documents
          </h1>
          <div className="bp-page-header__actions">
            <button
              type="button"
              className="bp-btn-solid"
              style={{ padding: "8px 14px", fontSize: "0.82rem", borderRadius: 20 }}
              onClick={() => openClientForm()}
              id="bp-add-client-btn"
            >
              <AddIcon /> Add
            </button>
            <button type="button" className="bp-btn-outline" onClick={() => openKyc()}>Full KYC Registration</button>
          </div>
        </div>
      )}

      {error && <div style={{ margin: "10px 12px 0", padding: "12px", background: "var(--bp-red-soft)", borderRadius: "var(--bp-radius)", color: "var(--bp-red)", fontSize: "0.88rem", border: "1px solid rgba(196,100,82,0.2)" }}>{error}</div>}
      {message && <div style={{ margin: "10px 12px 0", padding: "12px", background: "var(--bp-green-soft)", borderRadius: "var(--bp-radius)", color: "var(--bp-green)", fontSize: "0.88rem", border: "1px solid rgba(15,151,114,0.2)" }}>{message}</div>}

      {!loading && subScreen === "security" && selectedClient && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px" }}>
          <span className="bp-badge">KYC: {kycStatusLabel(selectedClient.kyc?.status)}</span>
          <button type="button" className="bp-btn-outline" onClick={() => openClientForm(selectedClient)}>Edit Client</button>
          <button type="button" className="bp-btn-solid" onClick={() => openKyc(selectedClient)}>Complete / Update KYC</button>
        </div>
      )}

      {loading && <div className="bp-loading"><div className="bp-spinner" /></div>}

      {/* ══ Screen 0: 4-Step New Client Add Wizard ══ */}
      {!loading && subScreen === "wizard" && (
        <NewClientAddWizard
          key={wizardCustomer?._id || "new"}
          customer={wizardCustomer}
          onComplete={async (createdClient) => {
            setMessage("Client KYC saved.");
            await loadCustomers();
            if (createdClient?._id) setSelectedClient(createdClient);
            setSubScreen("details");
          }}
          onCancel={async (savedClient) => {
            setSubScreen("security");
            await loadCustomers();
            if (savedClient?._id) setSelectedClient(savedClient);
          }}
        />
      )}

      {/* ══ Screen 1: KYC Security & Documents (KYC.jpeg) ══ */}
      {!loading && subScreen === "security" && (
        <KycSecurityScreen
          customers={customers}
          selectedCustomer={selectedClient}
          onSelectCustomer={setSelectedClient}
          onNavigateToForm={() => setSubScreen("form-summary")}
          onDownloadPdf={handleDownloadPdf}
          onAddNew={() => openClientForm()}
        />
      )}

      {/* ══ Screen 2: KYC Verified Details (KYC-Details.png) ══ */}
      {!loading && subScreen === "details" && (
        <KycDetailsView
          customer={selectedClient || customers[0]}
          broker={kycPreview?.broker}
          onBack={() => setSubScreen("security")}
          onEdit={() => openKyc(selectedClient || customers[0])}
          onEditClient={() => openClientForm(selectedClient || customers[0])}
        />
      )}

      {/* ══ Screen 3: KYC Form Summary (KYC-fillup.jpeg) ══ */}
      {!loading && subScreen === "form-summary" && (
        <KycFormSummaryScreen
          customer={selectedClient || customers[0]}
          kycForm={kycForm}
          onBack={() => setSubScreen("security")}
          onOpenEdit={() => openKyc(selectedClient || customers[0])}
        />
      )}

      {/* Client Drawer Form */}
      {showClientForm && (
        <NewClientSheet
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isEditing={Boolean(editingCustomerId)}
          error={error}
        />
      )}
    </div>
  );
}
