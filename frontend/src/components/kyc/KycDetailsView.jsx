import { useState } from "react";
import { formatDate } from "../../utils/formatters";
import { downloadCustomerKycPdf } from "../../utils/kycPdf";

// ── Icons ─────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
);

const UserDocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const CardDocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bp-green)" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
);

const BankDocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
);

const PinDocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "CL").slice(0, 2).toUpperCase();
}

export default function KycDetailsView({ customer, broker, onBack, onEdit }) {
  const [viewingDocModal, setViewingDocModal] = useState(null);

  const kyc = customer?.kyc || {};
  const verifiedDateStr = kyc.verifiedAt ? formatDate(kyc.verifiedAt) : kyc.submittedAt ? formatDate(kyc.submittedAt) : "-";
  const validTillStr = kyc.validTill ? formatDate(kyc.validTill) : "-";
  const statusLabel = kyc.status === "verified" || kyc.status === "generated" || kyc.status === "ready" ? "Verified" : "Incomplete";

  const handleDownloadPdf = () => {
    downloadCustomerKycPdf({ broker, client: customer });
  };

  const docItems = [
    {
      type: "Customer Photo",
      sub: "Passport Size Photograph",
      icon: <UserDocIcon />,
      date: verifiedDateStr,
      url: kyc.customerPhotoUrl,
      filename: "photo.jpg",
    },
    {
      type: "Customer Signature",
      sub: "Specimen Signature",
      icon: <EditIcon />,
      date: verifiedDateStr,
      url: kyc.customerSignatureUrl,
      filename: "signature.jpg",
    },
    {
      type: "PAN Card",
      sub: kyc.panNumber || "Not provided",
      icon: <UserDocIcon />,
      date: verifiedDateStr,
      url: kyc.panImageUrl,
      filename: kyc.panFilename,
    },
    {
      type: "Aadhaar Front",
      sub: kyc.aadhaarNumber || "Not provided",
      icon: <CardDocIcon />,
      date: verifiedDateStr,
      url: kyc.aadhaarFrontUrl,
      filename: kyc.aadhaarFilename,
    },
    {
      type: "Aadhaar Back",
      sub: kyc.aadhaarNumber || "Not provided",
      icon: <CardDocIcon />,
      date: verifiedDateStr,
      url: kyc.aadhaarBackUrl,
      filename: kyc.aadhaarFilename,
    },
    {
      type: "Bank Proof",
      sub: kyc.bankProofType || "Bank Proof",
      icon: <BankDocIcon />,
      date: verifiedDateStr,
      url: kyc.bankProofUrl,
      filename: kyc.bankProofFilename,
    },
    {
      type: "Address Proof",
      sub: kyc.addressProofType || "Address Proof",
      icon: <PinDocIcon />,
      date: verifiedDateStr,
      url: kyc.addressProofUrl,
      filename: kyc.addressProofFilename,
    },
  ];

  const historyEvents = kyc.history && kyc.history.length > 0 ? kyc.history : [
    {
      title: "KYC Verified",
      description: "KYC has been successfully verified.",
      timestamp: verifiedDateStr,
      iconType: "verify",
    },
    {
      title: "KYC Submitted",
      description: "KYC documents have been submitted.",
      timestamp: kyc.submittedAt ? formatDate(kyc.submittedAt) : verifiedDateStr,
      iconType: "submit",
    },
  ];

  return (
    <div className="bp-kyc-details-page">
      {/* Top Header */}
      <div className="bp-wizard-header" style={{ marginBottom: 12 }}>
        <button type="button" className="bp-drawer-back" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="bp-wizard-title">KYC Details</h1>
          <p className="bp-wizard-sub">View and manage client KYC information</p>
        </div>
        <button type="button" className="bp-edit-btn" onClick={onEdit}>
          <EditIcon /> Edit
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bp-profile-header-card">
        <div className="bp-avatar bp-avatar--lg" style={{ background: "#2563EB" }}>
          {getInitials(customer?.fullName || "")}
        </div>
        <div className="bp-profile-header-info">
          <div className="bp-profile-header-top">
            <span className="bp-profile-name">{customer?.fullName || "-"}</span>
            <span className={`bp-badge ${statusLabel === "Verified" ? "bp-badge--verified" : "bp-badge--inactive"}`}>
              {statusLabel === "Verified" ? "✓ Verified >" : "Incomplete"}
            </span>
          </div>
          <span className="bp-profile-code">{customer?.clientCode || customer?.idCode || "-"}</span>
          <div className="bp-profile-contact-row">
            <span><PhoneIcon /> {customer?.phone || "-"}</span>
            <span><MailIcon /> {customer?.email || "-"}</span>
          </div>
          {validTillStr !== "-" && (
            <span className="bp-profile-valid"><CalendarIcon /> Valid till {validTillStr}</span>
          )}
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="bp-metric-cards-grid">
        <div className="bp-metric-card">
          <span className="bp-metric-icon" style={{ background: "#DCFCE7", color: "#166534" }}>🗓</span>
          <span className="bp-metric-label">KYC Status</span>
          <span className={`bp-metric-val ${statusLabel === "Verified" ? "bp-profit" : "bp-loss"}`}>
            {statusLabel}
          </span>
        </div>
        <div className="bp-metric-card">
          <span className="bp-metric-icon" style={{ background: "#EEF2FF", color: "#4F46E5" }}>🗓</span>
          <span className="bp-metric-label">Submitted On</span>
          <span className="bp-metric-val">{verifiedDateStr}</span>
        </div>
        <div className="bp-metric-card">
          <span className="bp-metric-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>🗓</span>
          <span className="bp-metric-label">Verified On</span>
          <span className="bp-metric-val">{verifiedDateStr}</span>
        </div>
        <div className="bp-metric-card">
          <span className="bp-metric-icon" style={{ background: "#DCFCE7", color: "#166534" }}>🛡</span>
          <span className="bp-metric-label">Valid Till</span>
          <span className="bp-metric-val">{validTillStr}</span>
        </div>
      </div>

      {/* KYC Documents Section */}
      <div className="bp-details-section">
        <h3 className="bp-section-heading">KYC Documents</h3>
        <div className="bp-docs-list">
          {docItems.map((doc) => (
            <div key={doc.type} className="bp-doc-list-card">
              <div className="bp-doc-icon-badge">{doc.icon}</div>
              <div className="bp-doc-main-info">
                <span className="bp-doc-title">{doc.type}</span>
                <span className="bp-doc-sub">{doc.filename || doc.sub}</span>
              </div>
              <div className="bp-doc-status-col">
                <span className={`bp-badge ${doc.url || doc.filename ? "bp-badge--verified" : "bp-badge--inactive"}`}>
                  {doc.url || doc.filename ? "Uploaded" : "Pending"}
                </span>
                <span className="bp-doc-date">{doc.date}</span>
              </div>
              {doc.url && (
                <button
                  type="button"
                  className="bp-doc-view-link"
                  onClick={() => setViewingDocModal(doc.url)}
                >
                  View <ChevronRight />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Download PDF Button */}
        <button type="button" className="bp-btn-outline" style={{ marginTop: 14 }} onClick={handleDownloadPdf}>
          <DownloadIcon /> Download KYC Form (PDF)
        </button>
      </div>

      {/* KYC Information Section */}
      <div className="bp-details-section">
        <h3 className="bp-section-heading">KYC Information</h3>
        <div className="bp-info-rows-list">
          <div className="bp-info-row">
            <span className="bp-info-row-label">👤 Full Name</span>
            <span className="bp-info-row-val">{customer?.fullName || "-"}</span>
          </div>
          <div className="bp-info-row">
            <span className="bp-info-row-label">👤 First Name</span>
            <span className="bp-info-row-val">{kyc.firstName || "-"}</span>
          </div>
          <div className="bp-info-row">
            <span className="bp-info-row-label">👤 Last Name</span>
            <span className="bp-info-row-val">{kyc.lastName || "-"}</span>
          </div>
          <div className="bp-info-row">
            <span className="bp-info-row-label">👨 Father / Husband Name</span>
            <span className="bp-info-row-val">{kyc.fatherName || "-"}</span>
          </div>
          <div className="bp-info-row">
            <span className="bp-info-row-label">📅 Date of Birth</span>
            <span className="bp-info-row-val">{kyc.dateOfBirth ? formatDate(kyc.dateOfBirth) : "-"}</span>
          </div>
          <div className="bp-info-row">
            <span className="bp-info-row-label">📞 Mobile Number</span>
            <span className="bp-info-row-val">{customer?.phone || "-"}</span>
          </div>
          <div className="bp-info-row">
            <span className="bp-info-row-label">✉ Email Address</span>
            <span className="bp-info-row-val">{customer?.email || "-"}</span>
          </div>
          <div className="bp-info-row">
            <span className="bp-info-row-label">💰 Initial Deposit</span>
            <span className="bp-info-row-val">INR {(kyc.initialDeposit || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="bp-info-row">
            <span className="bp-info-row-label">🏠 Address</span>
            <span className="bp-info-row-val">
              {customer?.address || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* KYC History Section */}
      <div className="bp-details-section">
        <h3 className="bp-section-heading">KYC History</h3>
        <div className="bp-history-timeline">
          {historyEvents.map((evt, index) => (
            <div key={index} className="bp-timeline-item">
              <div className={`bp-timeline-icon ${evt.iconType === "verify" ? "is-verify" : "is-submit"}`}>
                {evt.iconType === "verify" ? "✓" : "↑"}
              </div>
              <div className="bp-timeline-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="bp-timeline-title">{evt.title}</span>
                  <span className="bp-timeline-time">{evt.timestamp}</span>
                </div>
                <p className="bp-timeline-desc">{evt.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Modal */}
      {viewingDocModal && (
        <div className="bp-modal-overlay" onClick={() => setViewingDocModal(null)}>
          <div className="bp-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={viewingDocModal} alt="KYC Document Preview" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12 }} />
            <button type="button" className="bp-btn-outline" style={{ marginTop: 12 }} onClick={() => setViewingDocModal(null)}>
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
