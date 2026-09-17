import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrokerAuth } from "../../context/BrokerAuthContext";
import { brokerApi } from "../../api/client";
import { ACCOUNT_ROUTES, ACCESS_ENTRY_PATH } from "../../constants/accessConfig";
import { initialsFromName, formatCurrency } from "../../utils/formatters";
import KycDetailsView from "../../components/kyc/KycDetailsView";

// ── Icons ─────────────────────────────────────────────────
const HeadsetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CameraIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Summary Margin Icons
const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/></svg>
);
const BarChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-green)" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);
const PieChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
);

// Menu Row Component matching Profile UI style
function ProfileMenuRow({ icon, title, sub, badge, onClick, danger, id }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid var(--bp-border)",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: danger ? "var(--bp-red-soft)" : "var(--bp-blue-soft)",
          color: danger ? "var(--bp-red)" : "var(--bp-blue)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: "0.92rem",
            fontWeight: 600,
            color: danger ? "var(--bp-red)" : "var(--bp-text)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {title}
        </span>
        {sub && (
          <span style={{ display: "block", fontSize: "0.78rem", color: danger ? "var(--bp-red)" : "var(--bp-muted)", marginTop: 2 }}>
            {sub}
          </span>
        )}
      </div>
      {badge && (
        <span style={{ fontSize: "0.8rem", color: "var(--bp-muted)", fontWeight: 500, marginRight: 4 }}>
          {badge}
        </span>
      )}
      <div style={{ color: danger ? "var(--bp-red)" : "var(--bp-muted2)", flexShrink: 0 }}>
        <ChevronRight />
      </div>
    </button>
  );
}

// ── Direct In-Profile KYC Edit Modal ─────────────────────
function EditProfileKycModal({ client, onClose, onSaveSuccess }) {
  const kyc = client?.kyc || {};
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: kyc.firstName || "",
    lastName: kyc.lastName || "",
    fatherName: kyc.fatherName || "",
    fullName: client?.fullName || "",
    dob: kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toISOString().slice(0, 10) : "",
    gender: kyc.gender || "male",
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
    occupation: kyc.occupation || "Business",
    annualIncome: kyc.annualIncome || "Below 1,00,000",
    initialDeposit: kyc.initialDeposit ?? 10000,
    panNumber: kyc.panNumber || "",
    aadhaarNumber: kyc.aadhaarNumber || "",
    bankName: kyc.bankName || "",
    accountNumber: kyc.accountNumber || "",
    ifscCode: kyc.ifscCode || "",
    bankAccountType: kyc.bankAccountType || "Savings",
    nationality: kyc.nationality || "Indian",
    pep: kyc.pep || "No",
    sourceOfFunds: kyc.sourceOfFunds || "Salary",
  });

  const [files, setFiles] = useState({
    customerPhoto: null,
    customerSignature: null,
    panImage: null,
    aadhaarFront: null,
    aadhaarBack: null,
    addressProof: null,
  });

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "firstName" || field === "lastName") {
        const fn = field === "firstName" ? value : prev.firstName;
        const ln = field === "lastName" ? value : prev.lastName;
        next.fullName = `${fn} ${ln}`.trim();
      }
      return next;
    });
  };

  const handleFileChange = (key, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        fullName: form.fullName.trim() || `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        kyc: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          fatherName: form.fatherName.trim(),
          dateOfBirth: form.dob ? new Date(form.dob) : null,
          gender: form.gender,
          occupation: form.occupation,
          annualIncome: form.annualIncome,
          initialDeposit: Number(form.initialDeposit || 0),
          panNumber: form.panNumber.trim().toUpperCase(),
          aadhaarNumber: form.aadhaarNumber.trim(),
          bankName: form.bankName.trim(),
          accountNumber: form.accountNumber.trim(),
          ifscCode: form.ifscCode.trim().toUpperCase(),
          bankAccountType: form.bankAccountType,
          nationality: form.nationality,
          pep: form.pep,
          sourceOfFunds: form.sourceOfFunds,
        },
      };

      const res = await brokerApi.patch(`/api/broker-portal/clients/${client._id}`, payload);
      let updatedClient = res.data;

      // Upload files if selected
      for (const [docType, fileObj] of Object.entries(files)) {
        if (fileObj) {
          const body = new FormData();
          body.append("file", fileObj);
          const uploadRes = await brokerApi.post(
            `/api/broker-portal/clients/${client._id}/documents/${docType}`,
            body,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          if (uploadRes.data) {
            updatedClient = uploadRes.data;
          }
        }
      }

      setSuccess("Profile & KYC updated successfully!");
      if (onSaveSuccess) onSaveSuccess(updatedClient);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ width: "100%", maxWidth: 600, background: "var(--bp-surface)", borderRadius: 16, maxHeight: "90vh", overflowY: "auto", padding: 20, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid var(--bp-border)", paddingBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--bp-text)" }}>Edit Profile & KYC Details</h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--bp-muted)" }}>Update customer details and upload document images directly</p>
          </div>
          <button type="button" className="bp-icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {error && <div style={{ padding: 10, background: "var(--bp-red-soft)", color: "var(--bp-red)", borderRadius: 8, fontSize: "0.82rem", marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ padding: 10, background: "var(--bp-green-soft)", color: "var(--bp-green)", borderRadius: 8, fontSize: "0.82rem", marginBottom: 12 }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          {/* Section 1: 4-Part Name */}
          <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: 700, color: "var(--bp-text)" }}>Applicant Names</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>First Name *</label>
                <input className="bp-input" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Last Name *</label>
                <input className="bp-input" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} required />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Father / Husband Name *</label>
              <input className="bp-input" value={form.fatherName} onChange={(e) => updateField("fatherName", e.target.value)} required />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Full Name *</label>
              <input className="bp-input" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
            </div>
          </div>

          {/* Section 2: Contact & Demographics */}
          <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: 700, color: "var(--bp-text)" }}>Contact & Personal Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Date of Birth</label>
                <input type="date" className="bp-input" value={form.dob} onChange={(e) => updateField("dob", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Gender</label>
                <select className="bp-input" value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Mobile Number</label>
                <input className="bp-input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Email Address</label>
                <input type="email" className="bp-input" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Initial Deposit (₹)</label>
              <input type="number" className="bp-input" value={form.initialDeposit} onChange={(e) => updateField("initialDeposit", e.target.value)} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Address</label>
              <textarea className="bp-input" rows={2} value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>
          </div>

          {/* Section 3: Identity Numbers & Bank Account Details */}
          <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: 700, color: "var(--bp-text)" }}>Identity & Bank Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>PAN Number</label>
                <input className="bp-input" value={form.panNumber} onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Aadhaar Number</label>
                <input className="bp-input" value={form.aadhaarNumber} onChange={(e) => updateField("aadhaarNumber", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Bank Name</label>
                <input className="bp-input" placeholder="e.g. State Bank of India" value={form.bankName} onChange={(e) => updateField("bankName", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Account Type</label>
                <select className="bp-input" value={form.bankAccountType} onChange={(e) => updateField("bankAccountType", e.target.value)}>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Account Number</label>
                <input className="bp-input" value={form.accountNumber} onChange={(e) => updateField("accountNumber", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>IFSC Code</label>
                <input className="bp-input" placeholder="e.g. SBIN0001234" value={form.ifscCode} onChange={(e) => updateField("ifscCode", e.target.value.toUpperCase())} />
              </div>
            </div>
          </div>

          {/* Section 4: Document Image Uploads */}
          <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: 700, color: "var(--bp-text)" }}>Upload / Update Document Images</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Customer Photo</label>
                <input type="file" accept="image/*" style={{ fontSize: "0.75rem" }} onChange={(e) => handleFileChange("customerPhoto", e)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Customer Signature</label>
                <input type="file" accept="image/*" style={{ fontSize: "0.75rem" }} onChange={(e) => handleFileChange("customerSignature", e)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>PAN Card Image</label>
                <input type="file" accept="image/*" style={{ fontSize: "0.75rem" }} onChange={(e) => handleFileChange("panImage", e)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Aadhaar Front Image</label>
                <input type="file" accept="image/*" style={{ fontSize: "0.75rem" }} onChange={(e) => handleFileChange("aadhaarFront", e)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Aadhaar Back Image</label>
                <input type="file" accept="image/*" style={{ fontSize: "0.75rem" }} onChange={(e) => handleFileChange("aadhaarBack", e)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", color: "var(--bp-muted)", marginBottom: 4 }}>Address / Bank Proof</label>
                <input type="file" accept="image/*" style={{ fontSize: "0.75rem" }} onChange={(e) => handleFileChange("addressProof", e)} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" className="bp-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="bp-btn-solid" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Profile Page ──────────────────────────────────────
export default function BrokerProfilePage() {
  const navigate = useNavigate();
  const { broker, selectedClient, setSelectedClient, logout } = useBrokerAuth();
  const [copied, setCopied] = useState("");
  const [freshClient, setFreshClient] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Fetch fresh client data from database on mount if selected
  useEffect(() => {
    async function loadFreshClient() {
      if (!selectedClient?._id) return;
      try {
        const res = await brokerApi.get(`/api/broker-portal/clients/${selectedClient._id}`);
        if (res.data) {
          setFreshClient(res.data);
          setSelectedClient(res.data);
        }
      } catch {
        // use context client as fallback
      }
    }
    loadFreshClient();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?._id]);

  const activeClient = freshClient || selectedClient;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  const handleLogout = () => {
    logout?.();
    navigate(ACCESS_ENTRY_PATH, { replace: true });
  };

  // Real client & broker fields
  const userName = activeClient?.fullName || broker?.branding?.brokerageHouseName || broker?.name || "No Client Selected";
  const userPhone = activeClient?.phone || broker?.contact?.phone || "Not provided";
  const userEmail = activeClient?.email || broker?.contact?.email || "Not provided";
  const clientId = activeClient?.clientCode || activeClient?.idCode || broker?.tokenId || "–";
  const segmentLabel = (activeClient?.segment || "intraday").toUpperCase();
  const statusLabel = activeClient?.status ? activeClient.status.toUpperCase() : "ACTIVE";

  // Account Summary Margins from Client
  const margin = activeClient?.margin || {};
  const balance = margin.accountBalance ?? 0;
  const availMargin = margin.availableMargin ?? 0;
  const usedMargin = margin.usedMargin ?? 0;
  const dpId = margin.dpId || "12081600";

  // KYC and Bank info
  const kyc = activeClient?.kyc || {};
  const bankProofType = kyc.bankProofType || "Bank Proof";
  const bankProofUrl = kyc.bankProofUrl || "";

  return (
    <div style={{ background: "var(--bp-bg)", minHeight: "100vh", paddingBottom: 80 }}>
      {/* ── Sticky Top Header ── */}
      <div className="bp-page-header">
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
          My Account
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className="bp-icon-btn" aria-label="Support" onClick={() => setShowSupportModal(true)}>
            <HeadsetIcon />
          </button>
          <div style={{ position: "relative" }}>
            <button type="button" className="bp-icon-btn" aria-label="Notifications" onClick={() => setShowNotificationModal(true)}>
              <BellIcon />
            </button>
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "var(--bp-red)",
                color: "#fff",
                fontSize: "0.62rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              1
            </span>
          </div>
        </div>
      </div>

      {/* ── User Profile Banner Card ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <button
          type="button"
          onClick={() => { if (activeClient) setShowKycModal(true); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 18px",
            background: "var(--bp-surface)",
            border: "1px solid var(--bp-border)",
            borderRadius: "var(--bp-radius-lg)",
            boxShadow: "var(--bp-shadow)",
            width: "100%",
            textAlign: "left",
            cursor: activeClient ? "pointer" : "default",
          }}
        >
          {/* Avatar with Camera Overlay */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              className="bp-avatar bp-avatar--lg"
              style={{ width: 56, height: 56, fontSize: "1.25rem", background: "var(--bp-blue)" }}
            >
              {initialsFromName(userName)}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "var(--bp-blue)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #fff",
              }}
            >
              <CameraIcon />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
              {userName}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--bp-muted)" }}>
              {userPhone}
            </p>
            <p style={{ margin: "2px 0 6px", fontSize: "0.82rem", color: "var(--bp-muted)" }}>
              {userEmail}
            </p>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 6,
                background: "var(--bp-blue-soft)",
                color: "var(--bp-blue)",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}
            >
              {segmentLabel}
            </span>
          </div>

          <div style={{ color: "var(--bp-muted2)" }}>
            <ChevronRight />
          </div>
        </button>
      </div>

      {/* ── Account Summary Card ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <div
          style={{
            background: "var(--bp-surface)",
            border: "1px solid var(--bp-border)",
            borderRadius: "var(--bp-radius-lg)",
            boxShadow: "var(--bp-shadow)",
            overflow: "hidden",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid var(--bp-border)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
              Account Summary
            </h3>
            <span className={`bp-badge ${statusLabel === "ACTIVE" ? "bp-badge--active" : ""}`}>
              {statusLabel}
            </span>
          </div>

          {/* Top 3 Margins Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "14px 12px", borderBottom: "1px solid var(--bp-border)" }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>Account Balance</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 4 }}>
                {formatCurrency(balance)}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bp-blue-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                <WalletIcon />
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>Available Margin</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 4 }}>
                {formatCurrency(availMargin)}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bp-green-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                <BarChartIcon />
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--bp-muted)", display: "block" }}>Used Margin</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif", display: "block", marginTop: 4 }}>
                {formatCurrency(usedMargin)}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                <PieChartIcon />
              </div>
            </div>
          </div>

          {/* Bottom DP ID & Client ID Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "12px 16px", borderRight: "1px solid var(--bp-border)" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--bp-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                DP ID
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
                  {dpId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(dpId, "dpId")}
                  style={{ background: "transparent", border: "none", color: "var(--bp-blue)", cursor: "pointer", padding: 0 }}
                  title="Copy DP ID"
                  id="bp-copy-dpid"
                >
                  <CopyIcon />
                </button>
              </div>
              {copied === "dpId" && <span style={{ fontSize: "0.65rem", color: "var(--bp-green)" }}>Copied!</span>}
            </div>

            <div style={{ padding: "12px 16px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--bp-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Client ID
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--bp-text)", fontFamily: "Inter, sans-serif" }}>
                  {clientId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(clientId, "clientId")}
                  style={{ background: "transparent", border: "none", color: "var(--bp-blue)", cursor: "pointer", padding: 0 }}
                  title="Copy Client ID"
                  id="bp-copy-clientid"
                >
                  <CopyIcon />
                </button>
              </div>
              {copied === "clientId" && <span style={{ fontSize: "0.65rem", color: "var(--bp-green)" }}>Copied!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Account & Profile ── */}
      <p style={{ margin: "20px 16px 8px", fontSize: "0.85rem", fontWeight: 600, color: "var(--bp-muted)", fontFamily: "Inter, sans-serif" }}>
        Account & Profile
      </p>
      <div style={{ margin: "0 16px", background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", boxShadow: "var(--bp-shadow)", overflow: "hidden" }}>
        <ProfileMenuRow
          id="bp-menu-personal"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          title="Personal Information"
          sub="View full personal and contact details"
          onClick={() => {
            if (activeClient) setShowKycModal(true);
            else navigate(ACCOUNT_ROUTES.customers);
          }}
        />
        <ProfileMenuRow
          id="bp-menu-bank"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 3l9 7H3l9-7z"/><line x1="5" y1="10" x2="5" y2="21"/><line x1="19" y1="10" x2="19" y2="21"/><line x1="9" y1="10" x2="9" y2="21"/><line x1="15" y1="10" x2="15" y2="21"/></svg>}
          title="Bank Details & Proofs"
          sub="View account bank proof and documents"
          onClick={() => setShowBankModal(true)}
        />
        <ProfileMenuRow
          id="bp-menu-kyc"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
          title="KYC Verification"
          badge={kyc.status ? kyc.status.toUpperCase() : "PENDING"}
          sub="Check verification status and documents"
          onClick={() => {
            if (activeClient) setShowKycModal(true);
            else navigate(ACCOUNT_ROUTES.customers);
          }}
        />
      </div>

      {/* ── Section 2: Portfolio & Orders ── */}
      <p style={{ margin: "20px 16px 8px", fontSize: "0.85rem", fontWeight: 600, color: "var(--bp-muted)", fontFamily: "Inter, sans-serif" }}>
        Portfolio & Trading
      </p>
      <div style={{ margin: "0 16px", background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", boxShadow: "var(--bp-shadow)", overflow: "hidden" }}>
        <ProfileMenuRow
          id="bp-menu-orders"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
          title="Orders & Trades"
          sub="View trade executions and active orders"
          onClick={() => navigate(ACCOUNT_ROUTES.trades)}
        />
        <ProfileMenuRow
          id="bp-menu-holdings"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
          title="Holdings & Portfolio"
          sub="View portfolio investments and positions"
          onClick={() => navigate(ACCOUNT_ROUTES.portfolio)}
        />
        <ProfileMenuRow
          id="bp-menu-invoice"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>}
          title="Statements & Invoices"
          sub="Generate trade statements and client invoices"
          onClick={() => navigate(ACCOUNT_ROUTES.invoice)}
        />
      </div>

      {/* ── Section 3: Support & Desk ── */}
      <p style={{ margin: "20px 16px 8px", fontSize: "0.85rem", fontWeight: 600, color: "var(--bp-muted)", fontFamily: "Inter, sans-serif" }}>
        Support & Operations
      </p>
      <div style={{ margin: "0 16px", background: "var(--bp-surface)", border: "1px solid var(--bp-border)", borderRadius: "var(--bp-radius-lg)", boxShadow: "var(--bp-shadow)", overflow: "hidden" }}>
        <ProfileMenuRow
          id="bp-menu-help"
          icon={<HeadsetIcon />}
          title="Broker Support Desk"
          sub={broker?.contact?.supportDesk || broker?.contact?.phone || "Contact operation desk"}
          onClick={() => setShowSupportModal(true)}
        />
        <ProfileMenuRow
          id="bp-menu-logout"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
          title="Logout"
          sub="Logout from broker account session"
          onClick={handleLogout}
          danger
        />
      </div>

      {/* ── Modal 1: Full KYC Details View Modal ── */}
      {showKycModal && activeClient && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "var(--bp-bg)", overflowY: "auto" }}>
          <KycDetailsView
            customer={activeClient}
            broker={broker}
            onBack={() => setShowKycModal(false)}
            onEdit={() => {
              setShowKycModal(false);
              setShowEditModal(true);
            }}
          />
        </div>
      )}

      {/* ── Modal 1.5: Direct Edit Profile & KYC Modal ── */}
      {showEditModal && activeClient && (
        <EditProfileKycModal
          client={activeClient}
          onClose={() => setShowEditModal(false)}
          onSaveSuccess={(updatedClient) => {
            setFreshClient(updatedClient);
            setSelectedClient(updatedClient);
          }}
        />
      )}

      {/* ── Modal 2: Bank Details Modal ── */}
      {showBankModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowBankModal(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 540, background: "var(--bp-surface)", borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "80vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid var(--bp-border)", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Bank Details & Verification Proof</h3>
              <button type="button" className="bp-icon-btn" onClick={() => setShowBankModal(false)}>
                <CloseIcon />
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block" }}>Bank Name</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{kyc.bankName || "Not provided"}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block" }}>Account Number</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{kyc.accountNumber || "Not provided"}</span>
                </div>

                <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block" }}>IFSC Code</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{kyc.ifscCode || "Not provided"}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block" }}>Account Type</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{kyc.bankAccountType || "Savings"}</span>
                </div>

                <div style={{ padding: 12, background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--bp-muted)", display: "block" }}>Proof Document Type</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{bankProofType}</span>
                </div>
              </div>

              {bankProofUrl ? (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Bank Proof Image</span>
                  <img src={bankProofUrl} alt="Bank Proof" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--bp-border)", maxHeight: 240, objectFit: "contain" }} />
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "var(--bp-muted)", margin: "8px 0" }}>No bank proof image uploaded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Support Modal ── */}
      {showSupportModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowSupportModal(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 540, background: "var(--bp-surface)", borderRadius: "20px 20px 0 0", padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid var(--bp-border)", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Broker Support Desk</h3>
              <button type="button" className="bp-icon-btn" onClick={() => setShowSupportModal(false)}>
                <CloseIcon />
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--bp-muted)" }}>
                {broker?.branding?.brokerageHouseName || broker?.name || "Broker Desk"} Support Channels
              </p>

              {broker?.contact?.phone && (
                <a
                  href={`tel:${broker.contact.phone}`}
                  style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", padding: "12px 14px", background: "var(--bp-blue-soft)", color: "var(--bp-blue)", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem" }}
                >
                  <span>Phone: {broker.contact.phone}</span>
                  <ChevronRight />
                </a>
              )}

              {broker?.contact?.email && (
                <a
                  href={`mailto:${broker.contact.email}`}
                  style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", padding: "12px 14px", background: "var(--bp-blue-soft)", color: "var(--bp-blue)", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem" }}
                >
                  <span>Email: {broker.contact.email}</span>
                  <ChevronRight />
                </a>
              )}

              {broker?.contact?.website && (
                <a
                  href={broker.contact.website.startsWith("http") ? broker.contact.website : `https://${broker.contact.website}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", padding: "12px 14px", background: "var(--bp-surface2)", color: "var(--bp-text)", borderRadius: 10, fontWeight: 600, fontSize: "0.9rem", border: "1px solid var(--bp-border)" }}
                >
                  <span>Website: {broker.contact.website}</span>
                  <ChevronRight />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 4: Notifications Modal ── */}
      {showNotificationModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowNotificationModal(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 540, background: "var(--bp-surface)", borderRadius: "20px 20px 0 0", padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid var(--bp-border)", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Notifications</h3>
              <button type="button" className="bp-icon-btn" onClick={() => setShowNotificationModal(false)}>
                <CloseIcon />
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ padding: "12px 14px", background: "var(--bp-surface2)", borderRadius: 10, border: "1px solid var(--bp-border)" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, display: "block" }}>Account Active</span>
                <span style={{ fontSize: "0.78rem", color: "var(--bp-muted)", display: "block", marginTop: 2 }}>
                  {activeClient ? `Account for ${userName} (${clientId}) is active.` : "Broker session active."}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
