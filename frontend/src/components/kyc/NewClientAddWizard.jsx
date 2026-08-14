import { useState } from "react";
import { brokerApi } from "../../api/client";

// ── Icons ─────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const IdBadgeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="15" y1="8" x2="17" y2="8"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

const UserPlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

const FingerprintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M2 12C2 6.5 6.5 2 12 2s10 4.5 10 10c0 3.5-2 6-4 8"/><path d="M5 12a7 7 0 0 1 12 0c0 2-1 4-3 5"/><path d="M8 12a4 4 0 0 1 8 0c0 1-.5 2.5-1.5 3.5"/><path d="M12 12v3"/></svg>
);

const BriefcaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);

const RupeeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 13l8.5 8"/><path d="M6 13h3a4.5 4.5 0 0 0 0-9"/></svg>
);

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

const CityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><rect x="2" y="6" width="8" height="14" rx="1"/><rect x="12" y="2" width="10" height="18" rx="1"/><line x1="5" y1="10" x2="5.01" y2="10"/><line x1="5" y1="14" x2="5.01" y2="14"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="16" y1="14" x2="16.01" y2="14"/></svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-red)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bp-blue)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);

function generateDefaultClientCode() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randNum = String(Math.floor(100 + Math.random() * 900));
  return `CLT${dateStr}${randNum}`;
}

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewClientAddWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    fullName: "",
    initialDeposit: "10000",
    clientCode: generateDefaultClientCode(),
    dob: "",
    gender: "",
    panNumber: "",
    panVerified: false,
    aadhaarNumber: "",
    aadhaarVerified: false,
    occupation: "",
    annualIncome: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    phone: "",
    mobileVerified: false,
    email: "",
    alternatePhone: "",
    preferredCommunication: "Email",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    bankAccountType: "Savings",
    notes: "",
    panFile: null,
    aadhaarFrontFile: null,
    aadhaarBackFile: null,
    customerPhotoFile: null,
    customerSignatureFile: null,
    addressProofType: "Aadhaar Card",
    addressProofFile: null,
    nationality: "Indian",
    pep: "No",
    sourceOfFunds: "Salary",
  });

  const updateField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "firstName" || field === "lastName") {
        const fn = field === "firstName" ? value : prev.firstName;
        const ln = field === "lastName" ? value : prev.lastName;
        next.fullName = `${fn} ${ln}`.trim();
      }
      return next;
    });
  };

  const handleVerify = (field) => {
    if (field === "pan" && formData.panNumber.trim()) {
      updateField("panVerified", true);
    } else if (field === "aadhaar" && formData.aadhaarNumber.trim()) {
      updateField("aadhaarVerified", true);
    } else if (field === "mobile" && formData.phone.trim()) {
      updateField("mobileVerified", true);
    }
  };

  const handleFileUpload = (field, event) => {
    const file = event.target.files?.[0];
    if (file) {
      updateField(field, { file, name: file.name, size: file.size });
    }
  };

  const removeFile = (field) => {
    updateField(field, null);
  };

  const validateStep = (currentStep) => {
    setError("");
    if (currentStep === 1) {
      if (!formData.firstName.trim()) { setError("First Name is required."); return false; }
      if (!formData.lastName.trim()) { setError("Last Name is required."); return false; }
      if (!formData.fatherName.trim()) { setError("Father/Husband Name is required."); return false; }
      if (!formData.dob) { setError("Date of Birth is required."); return false; }
      if (!formData.gender) { setError("Gender is required."); return false; }
      if (!formData.panNumber.trim()) { setError("PAN Number is required."); return false; }
      if (!formData.occupation) { setError("Occupation is required."); return false; }
      if (!formData.annualIncome) { setError("Annual Income is required."); return false; }
      if (!formData.address.trim()) { setError("Address is required."); return false; }
      if (!formData.state) { setError("State is required."); return false; }
      if (!formData.city) { setError("City is required."); return false; }
      if (!formData.pincode.trim()) { setError("Pincode is required."); return false; }
    } else if (currentStep === 2) {
      if (!formData.phone.trim()) { setError("Mobile Number is required."); return false; }
      if (!formData.address.trim()) { setError("Communication Address is required."); return false; }
    } else if (currentStep === 3) {
      if (!formData.panFile) { setError("PAN Card image upload is required."); return false; }
      if (!formData.aadhaarFrontFile) { setError("Aadhaar Front image upload is required."); return false; }
      if (!formData.aadhaarBackFile) { setError("Aadhaar Back image upload is required."); return false; }
      if (!formData.customerPhotoFile) { setError("Customer Photo upload is required."); return false; }
      if (!formData.customerSignatureFile) { setError("Customer Signature upload is required."); return false; }
    }
    return true;
  };

  const goToNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  async function handleFinalSubmit() {
    setSaving(true);
    setError("");

    const calculatedFullName = formData.fullName.trim() || `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    const payload = {
      fullName: calculatedFullName,
      clientCode: formData.clientCode,
      idCode: formData.clientCode,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      notes: formData.notes.trim(),
      kyc: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fatherName: formData.fatherName.trim(),
        dateOfBirth: formData.dob ? new Date(formData.dob) : null,
        gender: formData.gender.toLowerCase(),
        occupation: formData.occupation,
        annualIncome: formData.annualIncome,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        preferredCommunication: formData.preferredCommunication,
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        bankAccountType: formData.bankAccountType,
        initialDeposit: Number(formData.initialDeposit || 0),
        panNumber: formData.panNumber.trim().toUpperCase(),
        panVerified: formData.panVerified,
        aadhaarNumber: formData.aadhaarNumber.trim(),
        aadhaarVerified: formData.aadhaarVerified,
        mobileVerified: formData.mobileVerified,
        addressProofType: formData.addressProofType,
        nationality: formData.nationality,
        pep: formData.pep,
        sourceOfFunds: formData.sourceOfFunds,
        status: "verified",
        panFilename: formData.panFile?.name || "",
        panSize: formData.panFile?.size || 0,
        aadhaarFilename: formData.aadhaarFrontFile?.name || "",
        aadhaarSize: formData.aadhaarFrontFile?.size || 0,
        addressProofFilename: formData.addressProofFile?.name || "",
        addressProofSize: formData.addressProofFile?.size || 0,
      },
    };

    try {
      const res = await brokerApi.post("/api/broker-portal/clients", payload);
      let updatedClient = res.data;
      const clientId = updatedClient._id;

      // Upload document files if provided
      const uploadsToRun = [
        { fileObj: formData.panFile, docType: "panImage" },
        { fileObj: formData.aadhaarFrontFile, docType: "aadhaarFront" },
        { fileObj: formData.aadhaarBackFile, docType: "aadhaarBack" },
        { fileObj: formData.customerPhotoFile, docType: "customerPhoto" },
        { fileObj: formData.customerSignatureFile, docType: "customerSignature" },
        { fileObj: formData.addressProofFile, docType: "addressProof" },
      ];

      for (const item of uploadsToRun) {
        if (item.fileObj?.file) {
          const body = new FormData();
          body.append("file", item.fileObj.file);
          const uploadRes = await brokerApi.post(
            `/api/broker-portal/clients/${clientId}/documents/${item.docType}`,
            body,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          if (uploadRes.data) {
            updatedClient = uploadRes.data;
          }
        }
      }

      if (onComplete) onComplete(updatedClient);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create client.");
    } finally {
      setSaving(false);
    }
  }

  // Steps configuration
  const stepsList = [
    { num: 1, label: "Personal Info" },
    { num: 2, label: "Contact Info" },
    { num: 3, label: "KYC Info" },
    { num: 4, label: "Review" },
  ];

  return (
    <div className="bp-wizard-container">
      {/* ── Top Header Bar ── */}
      <div className="bp-wizard-header">
        <button type="button" className="bp-drawer-back" onClick={onCancel} aria-label="Back">
          <BackIcon />
        </button>
        <div>
          <h1 className="bp-wizard-title">New Client Add</h1>
          <p className="bp-wizard-sub">Add client details to get started</p>
        </div>
      </div>

      {/* ── Stepper Bar ── */}
      <div className="bp-stepper">
        {stepsList.map((s, idx) => {
          const isDone = step > s.num;
          const isActive = step === s.num;
          return (
            <div key={s.num} className="bp-stepper-item" onClick={() => isDone && setStep(s.num)}>
              <div className={`bp-stepper-circle ${isDone ? "is-done" : isActive ? "is-active" : ""}`}>
                {isDone ? <CheckIcon /> : s.num}
              </div>
              <span className={`bp-stepper-label ${isDone ? "is-done" : isActive ? "is-active" : ""}`}>
                {s.label}
              </span>
              {idx < stepsList.length - 1 && (
                <div className={`bp-stepper-line ${step > s.num ? "is-done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {error && <div className="bp-wizard-error" style={{ padding: "10px", background: "var(--bp-red-soft)", color: "var(--bp-red)", borderRadius: "10px", fontSize: "0.82rem", marginBottom: "10px" }}>{error}</div>}

      {/* ════ STEP 1: Personal Info ════ */}
      {step === 1 && (
        <div className="bp-wizard-body">
          <h2 className="bp-section-heading">Personal Information</h2>

          {/* First Name & Last Name Grid */}
          <div className="bp-form-grid-2">
            <div className="bp-input-group">
              <div className="bp-input-icon"><UserIcon /></div>
              <div className="bp-input-wrapper">
                <label>First Name *</label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                />
              </div>
            </div>
            <div className="bp-input-group">
              <div className="bp-input-icon"><UserIcon /></div>
              <div className="bp-input-wrapper">
                <label>Last Name *</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Father / Husband Name */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><UserIcon /></div>
            <div className="bp-input-wrapper">
              <label>Father / Husband Name *</label>
              <input
                type="text"
                placeholder="Enter father or husband name"
                value={formData.fatherName}
                onChange={(e) => updateField("fatherName", e.target.value)}
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><UserIcon /></div>
            <div className="bp-input-wrapper">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
              />
            </div>
          </div>

          {/* Initial Deposit & Client Code Grid */}
          <div className="bp-form-grid-2">
            <div className="bp-input-group">
              <div className="bp-input-icon"><RupeeIcon /></div>
              <div className="bp-input-wrapper">
                <label>Initial Deposit (₹)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={formData.initialDeposit}
                  onChange={(e) => updateField("initialDeposit", e.target.value)}
                />
              </div>
            </div>
            <div className="bp-input-group is-readonly">
              <div className="bp-input-icon"><IdBadgeIcon /></div>
              <div className="bp-input-wrapper">
                <label>Client Code (Auto)</label>
                <input type="text" value={formData.clientCode} readOnly />
              </div>
            </div>
          </div>

          {/* DOB & Gender Grid */}
          <div className="bp-form-grid-2">
            <div className="bp-input-group">
              <div className="bp-input-icon"><CalendarIcon /></div>
              <div className="bp-input-wrapper">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => updateField("dob", e.target.value)}
                />
              </div>
            </div>
            <div className="bp-input-group">
              <div className="bp-input-icon"><UserPlusIcon /></div>
              <div className="bp-input-wrapper">
                <label>Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* PAN Number + Verify */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><ShieldIcon /></div>
            <div className="bp-input-wrapper">
              <label>PAN Number *</label>
              <input
                type="text"
                placeholder="Enter PAN number"
                value={formData.panNumber}
                onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())}
              />
            </div>
            {formData.panVerified ? (
              <span className="bp-badge bp-badge--verified">✓ Verified</span>
            ) : (
              <button type="button" className="bp-verify-btn" onClick={() => handleVerify("pan")}>
                Verify
              </button>
            )}
          </div>

          {/* Aadhaar Number + Verify */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><FingerprintIcon /></div>
            <div className="bp-input-wrapper">
              <label>Aadhaar Number</label>
              <input
                type="text"
                placeholder="Enter Aadhaar number"
                value={formData.aadhaarNumber}
                onChange={(e) => updateField("aadhaarNumber", e.target.value)}
              />
            </div>
            {formData.aadhaarVerified ? (
              <span className="bp-badge bp-badge--verified">✓ Verified</span>
            ) : (
              <button type="button" className="bp-verify-btn" onClick={() => handleVerify("aadhaar")}>
                Verify
              </button>
            )}
          </div>

          {/* Occupation */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><BriefcaseIcon /></div>
            <div className="bp-input-wrapper">
              <label>Occupation *</label>
              <select
                value={formData.occupation}
                onChange={(e) => updateField("occupation", e.target.value)}
              >
                <option value="">Select occupation</option>
                <option value="Business">Business</option>
                <option value="Salaried">Salaried</option>
                <option value="Self Employed">Self Employed</option>
                <option value="Professional">Professional</option>
                <option value="Retired">Retired</option>
                <option value="Student">Student</option>
              </select>
            </div>
          </div>

          {/* Annual Income */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><RupeeIcon /></div>
            <div className="bp-input-wrapper">
              <label>Annual Income (₹) *</label>
              <select
                value={formData.annualIncome}
                onChange={(e) => updateField("annualIncome", e.target.value)}
              >
                <option value="">Select income range</option>
                <option value="Below ₹1,00,000">Below ₹1,00,000</option>
                <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
                <option value="₹5,00,000 - ₹10,00,000">₹5,00,000 - ₹10,00,000</option>
                <option value="₹10,00,000 - ₹25,00,000">₹10,00,000 - ₹25,00,000</option>
                <option value="Above ₹25,00,000">Above ₹25,00,000</option>
              </select>
            </div>
          </div>

          <h2 className="bp-section-heading" style={{ marginTop: 20 }}>Address Information</h2>

          {/* Address */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><HomeIcon /></div>
            <div className="bp-input-wrapper">
              <label>Address *</label>
              <input
                type="text"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>
          </div>

          {/* State / City / Pincode Grid */}
          <div className="bp-form-grid-3">
            <div className="bp-input-group">
              <div className="bp-input-icon"><MapPinIcon /></div>
              <div className="bp-input-wrapper">
                <label>State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                >
                  <option value="">Select state</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Rajasthan">Rajasthan</option>
                </select>
              </div>
            </div>
            <div className="bp-input-group">
              <div className="bp-input-icon"><CityIcon /></div>
              <div className="bp-input-wrapper">
                <label>City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                >
                  <option value="">Select city</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Rajkot">Rajkot</option>
                  <option value="Surat">Surat</option>
                  <option value="Vadodara">Vadodara</option>
                  <option value="Mumbai">Mumbai</option>
                </select>
              </div>
            </div>
            <div className="bp-input-group">
              <div className="bp-input-icon"><MapPinIcon /></div>
              <div className="bp-input-wrapper">
                <label>Pincode *</label>
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={formData.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="bp-wizard-footer">
            <button type="button" className="bp-btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="bp-btn-solid" onClick={goToNext}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ════ STEP 2: Contact Info ════ */}
      {step === 2 && (
        <div className="bp-wizard-body">
          <h2 className="bp-section-heading">Contact Information</h2>

          {/* Mobile Number + Verify */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><PhoneIcon /></div>
            <div className="bp-input-wrapper">
              <label>Mobile Number *</label>
              <input
                type="text"
                placeholder="Enter 10 digit mobile number"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            {formData.mobileVerified ? (
              <span className="bp-badge bp-badge--verified">✓ Verified</span>
            ) : (
              <button type="button" className="bp-verify-btn" onClick={() => handleVerify("mobile")}>
                Verify
              </button>
            )}
          </div>

          {/* Email ID */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><MailIcon /></div>
            <div className="bp-input-wrapper">
              <label>Email ID</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </div>

          {/* Alternate Mobile Number */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><PhoneIcon /></div>
            <div className="bp-input-wrapper">
              <label>Alternate Mobile Number</label>
              <input
                type="text"
                placeholder="Enter alternate mobile number (Optional)"
                value={formData.alternatePhone}
                onChange={(e) => updateField("alternatePhone", e.target.value)}
              />
            </div>
          </div>

          <h2 className="bp-section-heading" style={{ marginTop: 20 }}>Communication Address</h2>

          {/* Address */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><HomeIcon /></div>
            <div className="bp-input-wrapper">
              <label>Address *</label>
              <input
                type="text"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>
          </div>

          {/* State / City / Pincode */}
          <div className="bp-form-grid-3">
            <div className="bp-input-group">
              <div className="bp-input-icon"><MapPinIcon /></div>
              <div className="bp-input-wrapper">
                <label>State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                >
                  <option value="">Select state</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>
            </div>
            <div className="bp-input-group">
              <div className="bp-input-icon"><CityIcon /></div>
              <div className="bp-input-wrapper">
                <label>City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                >
                  <option value="">Select city</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Rajkot">Rajkot</option>
                  <option value="Surat">Surat</option>
                </select>
              </div>
            </div>
            <div className="bp-input-group">
              <div className="bp-input-icon"><MapPinIcon /></div>
              <div className="bp-input-wrapper">
                <label>Pincode *</label>
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={formData.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                />
              </div>
            </div>
          </div>

          <h2 className="bp-section-heading" style={{ marginTop: 20 }}>Bank Account Details</h2>

          {/* Bank Name & Account Type */}
          <div className="bp-form-grid-2">
            <div className="bp-input-group">
              <div className="bp-input-icon"><IdBadgeIcon /></div>
              <div className="bp-input-wrapper">
                <label>Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={formData.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)}
                />
              </div>
            </div>
            <div className="bp-input-group">
              <div className="bp-input-icon"><BriefcaseIcon /></div>
              <div className="bp-input-wrapper">
                <label>Account Type</label>
                <select
                  value={formData.bankAccountType}
                  onChange={(e) => updateField("bankAccountType", e.target.value)}
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>
            </div>
          </div>

          {/* Account Number & IFSC Code */}
          <div className="bp-form-grid-2">
            <div className="bp-input-group">
              <div className="bp-input-icon"><IdBadgeIcon /></div>
              <div className="bp-input-wrapper">
                <label>Account Number</label>
                <input
                  type="text"
                  placeholder="Enter Bank Account Number"
                  value={formData.accountNumber}
                  onChange={(e) => updateField("accountNumber", e.target.value)}
                />
              </div>
            </div>
            <div className="bp-input-group">
              <div className="bp-input-icon"><ShieldIcon /></div>
              <div className="bp-input-wrapper">
                <label>IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={formData.ifscCode}
                  onChange={(e) => updateField("ifscCode", e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          <h2 className="bp-section-heading" style={{ marginTop: 20 }}>Additional Details</h2>

          {/* Preferred Communication */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><IdBadgeIcon /></div>
            <div className="bp-input-wrapper">
              <label>Preferred Communication *</label>
              <select
                value={formData.preferredCommunication}
                onChange={(e) => updateField("preferredCommunication", e.target.value)}
              >
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Call">Call</option>
              </select>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><EditIcon /></div>
            <div className="bp-input-wrapper">
              <label>Notes (Optional)</label>
              <input
                type="text"
                placeholder="Add any additional notes about the client"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="bp-wizard-footer">
            <button type="button" className="bp-btn-outline" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button type="button" className="bp-btn-solid" onClick={goToNext}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ════ STEP 3: KYC Info ════ */}
      {step === 3 && (
        <div className="bp-wizard-body">
          {/* Info Alert Box */}
          <div className="bp-alert-box">
            <InfoIcon />
            <span>Please provide valid KYC documents and photo/signature. All documents should be clear and legible.</span>
          </div>

          <h2 className="bp-section-heading">Applicant Photos & Signatures</h2>

          {/* Customer Photo Upload Card */}
          <div className="bp-upload-card-wrapper">
            <div className="bp-input-group">
              <div className="bp-input-icon"><UserIcon /></div>
              <div className="bp-input-wrapper">
                <label>Customer Photo *</label>
                <span className="bp-input-subtext">Upload applicant passport size photograph</span>
              </div>
            </div>
            {formData.customerPhotoFile ? (
              <div className="bp-uploaded-file-row">
                <div className="bp-file-icon"><FileIcon /></div>
                <div className="bp-file-info">
                  <span className="bp-file-name">{formData.customerPhotoFile.name}</span>
                  <span className="bp-file-size">{formatFileSize(formData.customerPhotoFile.size)}</span>
                </div>
                <div className="bp-file-check"><CheckIcon /></div>
                <button type="button" className="bp-file-delete" onClick={() => removeFile("customerPhotoFile")}>
                  <TrashIcon />
                </button>
              </div>
            ) : (
              <label className="bp-file-dropzone">
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload("customerPhotoFile", e)} hidden />
                <span>Click to upload Customer Photograph</span>
              </label>
            )}
          </div>

          {/* Customer Signature Upload Card */}
          <div className="bp-upload-card-wrapper" style={{ marginTop: 12 }}>
            <div className="bp-input-group">
              <div className="bp-input-icon"><EditIcon /></div>
              <div className="bp-input-wrapper">
                <label>Customer Signature *</label>
                <span className="bp-input-subtext">Upload specimen signature image</span>
              </div>
            </div>
            {formData.customerSignatureFile ? (
              <div className="bp-uploaded-file-row">
                <div className="bp-file-icon"><FileIcon /></div>
                <div className="bp-file-info">
                  <span className="bp-file-name">{formData.customerSignatureFile.name}</span>
                  <span className="bp-file-size">{formatFileSize(formData.customerSignatureFile.size)}</span>
                </div>
                <div className="bp-file-check"><CheckIcon /></div>
                <button type="button" className="bp-file-delete" onClick={() => removeFile("customerSignatureFile")}>
                  <TrashIcon />
                </button>
              </div>
            ) : (
              <label className="bp-file-dropzone">
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload("customerSignatureFile", e)} hidden />
                <span>Click to upload Customer Signature</span>
              </label>
            )}
          </div>

          <h2 className="bp-section-heading" style={{ marginTop: 20 }}>Identity Documents</h2>

          {/* PAN Number Display & Upload */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><ShieldIcon /></div>
            <div className="bp-input-wrapper">
              <label>PAN Number *</label>
              <input type="text" value={formData.panNumber || "-"} readOnly />
            </div>
            {formData.panVerified && <span className="bp-badge bp-badge--verified">✓ Verified</span>}
          </div>

          <div className="bp-upload-card-wrapper">
            <div className="bp-input-group">
              <div className="bp-input-icon"><IdBadgeIcon /></div>
              <div className="bp-input-wrapper">
                <label>PAN Card Image *</label>
                <span className="bp-input-subtext">Upload clear PAN card image</span>
              </div>
            </div>
            {formData.panFile ? (
              <div className="bp-uploaded-file-row">
                <div className="bp-file-icon"><FileIcon /></div>
                <div className="bp-file-info">
                  <span className="bp-file-name">{formData.panFile.name}</span>
                  <span className="bp-file-size">{formatFileSize(formData.panFile.size)}</span>
                </div>
                <div className="bp-file-check"><CheckIcon /></div>
                <button type="button" className="bp-file-delete" onClick={() => removeFile("panFile")}>
                  <TrashIcon />
                </button>
              </div>
            ) : (
              <label className="bp-file-dropzone">
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload("panFile", e)} hidden />
                <span>Click to upload PAN Card image</span>
              </label>
            )}
          </div>

          {/* Aadhaar Number Display & Dual Upload */}
          <div className="bp-input-group" style={{ marginTop: 14 }}>
            <div className="bp-input-icon"><FingerprintIcon /></div>
            <div className="bp-input-wrapper">
              <label>Aadhaar Number *</label>
              <input type="text" value={formData.aadhaarNumber || "-"} readOnly />
            </div>
            {formData.aadhaarVerified && <span className="bp-badge bp-badge--verified">✓ Verified</span>}
          </div>

          {/* Aadhaar Front */}
          <div className="bp-upload-card-wrapper">
            <div className="bp-input-group">
              <div className="bp-input-icon"><IdBadgeIcon /></div>
              <div className="bp-input-wrapper">
                <label>Aadhaar Front Image *</label>
                <span className="bp-input-subtext">Upload front side of Aadhaar card</span>
              </div>
            </div>
            {formData.aadhaarFrontFile ? (
              <div className="bp-uploaded-file-row">
                <div className="bp-file-icon"><FileIcon /></div>
                <div className="bp-file-info">
                  <span className="bp-file-name">{formData.aadhaarFrontFile.name}</span>
                  <span className="bp-file-size">{formatFileSize(formData.aadhaarFrontFile.size)}</span>
                </div>
                <div className="bp-file-check"><CheckIcon /></div>
                <button type="button" className="bp-file-delete" onClick={() => removeFile("aadhaarFrontFile")}>
                  <TrashIcon />
                </button>
              </div>
            ) : (
              <label className="bp-file-dropzone">
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload("aadhaarFrontFile", e)} hidden />
                <span>Click to upload Aadhaar Front Image</span>
              </label>
            )}
          </div>

          {/* Aadhaar Back */}
          <div className="bp-upload-card-wrapper" style={{ marginTop: 12 }}>
            <div className="bp-input-group">
              <div className="bp-input-icon"><IdBadgeIcon /></div>
              <div className="bp-input-wrapper">
                <label>Aadhaar Back Image *</label>
                <span className="bp-input-subtext">Upload back side of Aadhaar card</span>
              </div>
            </div>
            {formData.aadhaarBackFile ? (
              <div className="bp-uploaded-file-row">
                <div className="bp-file-icon"><FileIcon /></div>
                <div className="bp-file-info">
                  <span className="bp-file-name">{formData.aadhaarBackFile.name}</span>
                  <span className="bp-file-size">{formatFileSize(formData.aadhaarBackFile.size)}</span>
                </div>
                <div className="bp-file-check"><CheckIcon /></div>
                <button type="button" className="bp-file-delete" onClick={() => removeFile("aadhaarBackFile")}>
                  <TrashIcon />
                </button>
              </div>
            ) : (
              <label className="bp-file-dropzone">
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload("aadhaarBackFile", e)} hidden />
                <span>Click to upload Aadhaar Back Image</span>
              </label>
            )}
          </div>

          <h2 className="bp-section-heading" style={{ marginTop: 20 }}>Address Proof</h2>

          {/* Address Proof Type */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><MapPinIcon /></div>
            <div className="bp-input-wrapper">
              <label>Select Address Proof Type *</label>
              <select
                value={formData.addressProofType}
                onChange={(e) => updateField("addressProofType", e.target.value)}
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Driving License">Driving License</option>
                <option value="Utility Bill">Utility Bill</option>
              </select>
            </div>
          </div>

          {/* Address Proof File Upload Card */}
          <div className="bp-upload-card-wrapper">
            <div className="bp-input-group">
              <div className="bp-input-icon"><HomeIcon /></div>
              <div className="bp-input-wrapper">
                <label>Address Proof *</label>
                <span className="bp-input-subtext">Upload address proof image</span>
              </div>
            </div>
            {formData.addressProofFile ? (
              <div className="bp-uploaded-file-row">
                <div className="bp-file-icon"><FileIcon /></div>
                <div className="bp-file-info">
                  <span className="bp-file-name">{formData.addressProofFile.name}</span>
                  <span className="bp-file-size">{formatFileSize(formData.addressProofFile.size)}</span>
                </div>
                <div className="bp-file-check"><CheckIcon /></div>
                <button type="button" className="bp-file-delete" onClick={() => removeFile("addressProofFile")}>
                  <TrashIcon />
                </button>
              </div>
            ) : (
              <label className="bp-file-dropzone">
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload("addressProofFile", e)} hidden />
                <span>Click to upload Address Proof image</span>
              </label>
            )}
          </div>

          <h2 className="bp-section-heading" style={{ marginTop: 20 }}>Other Details</h2>

          {/* Nationality */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><UserIcon /></div>
            <div className="bp-input-wrapper">
              <label>Nationality *</label>
              <select
                value={formData.nationality}
                onChange={(e) => updateField("nationality", e.target.value)}
              >
                <option value="Indian">Indian</option>
                <option value="NRI">NRI</option>
                <option value="Foreign National">Foreign National</option>
              </select>
            </div>
          </div>

          {/* PEP (Politically Exposed Person) Segmented Toggle */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><CalendarIcon /></div>
            <div className="bp-input-wrapper">
              <label>PEP (Politically Exposed Person) *</label>
              <span className="bp-input-subtext">Is the client a PEP?</span>
            </div>
            <div className="bp-toggle-group">
              <button
                type="button"
                className={`bp-toggle-btn ${formData.pep === "Yes" ? "is-active" : ""}`}
                onClick={() => updateField("pep", "Yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={`bp-toggle-btn ${formData.pep === "No" ? "is-active" : ""}`}
                onClick={() => updateField("pep", "No")}
              >
                No
              </button>
            </div>
          </div>

          {/* Source of Funds */}
          <div className="bp-input-group">
            <div className="bp-input-icon"><FileIcon /></div>
            <div className="bp-input-wrapper">
              <label>Source of Funds *</label>
              <select
                value={formData.sourceOfFunds}
                onChange={(e) => updateField("sourceOfFunds", e.target.value)}
              >
                <option value="Salary">Salary</option>
                <option value="Business Income">Business Income</option>
                <option value="Investments">Investments</option>
                <option value="Inheritance">Inheritance</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="bp-wizard-footer">
            <button type="button" className="bp-btn-outline" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button type="button" className="bp-btn-solid" onClick={goToNext}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ════ STEP 4: Review ════ */}
      {step === 4 && (
        <div className="bp-wizard-body">
          <div className="bp-review-card">
            <div className="bp-review-card-header">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="bp-review-icon-badge"><FileIcon /></div>
                <div>
                  <h3>Review Client Details</h3>
                  <p>Please review all details before adding the client.</p>
                </div>
              </div>
              <button type="button" className="bp-edit-btn" onClick={() => setStep(1)}>
                <EditIcon /> Edit
              </button>
            </div>

            {/* Personal Information Grid */}
            <div className="bp-review-section">
              <h4>Personal Information</h4>
              <div className="bp-review-grid-2">
                <div>
                  <span className="bp-review-label">First Name</span>
                  <span className="bp-review-val">{formData.firstName || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Last Name</span>
                  <span className="bp-review-val">{formData.lastName || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Father / Husband Name</span>
                  <span className="bp-review-val">{formData.fatherName || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Full Name</span>
                  <span className="bp-review-val">{formData.fullName || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Initial Deposit</span>
                  <span className="bp-review-val">₹{Number(formData.initialDeposit || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="bp-review-label">Gender</span>
                  <span className="bp-review-val">{formData.gender || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Client Code</span>
                  <span className="bp-review-val">{formData.clientCode}</span>
                </div>
                <div>
                  <span className="bp-review-label">Nationality</span>
                  <span className="bp-review-val">{formData.nationality || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Date of Birth</span>
                  <span className="bp-review-val">{formData.dob || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Source of Funds</span>
                  <span className="bp-review-val">{formData.sourceOfFunds || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">PAN Number</span>
                  <span className="bp-review-val">{formData.panNumber || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">PEP</span>
                  <span className="bp-review-val">{formData.pep || "No"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Aadhaar Number</span>
                  <span className="bp-review-val">{formData.aadhaarNumber || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Occupation</span>
                  <span className="bp-review-val">{formData.occupation || "-"}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span className="bp-review-label">Annual Income</span>
                  <span className="bp-review-val">{formData.annualIncome || "-"}</span>
                </div>
              </div>
            </div>

            {/* Bank Account Details Grid */}
            <div className="bp-review-section">
              <h4>Bank Account Details</h4>
              <div className="bp-review-grid-2">
                <div>
                  <span className="bp-review-label">Bank Name</span>
                  <span className="bp-review-val">{formData.bankName || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Account Type</span>
                  <span className="bp-review-val">{formData.bankAccountType || "Savings"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Account Number</span>
                  <span className="bp-review-val">{formData.accountNumber || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">IFSC Code</span>
                  <span className="bp-review-val">{formData.ifscCode || "-"}</span>
                </div>
              </div>
            </div>

            {/* Contact Information Grid */}
            <div className="bp-review-section">
              <h4>Contact Information</h4>
              <div className="bp-review-grid-2">
                <div>
                  <span className="bp-review-label">Mobile Number</span>
                  <span className="bp-review-val">{formData.phone || "-"}</span>
                </div>
                <div>
                  <span className="bp-review-label">Preferred Communication</span>
                  <span className="bp-review-val">{formData.preferredCommunication || "-"}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span className="bp-review-label">Email ID</span>
                  <span className="bp-review-val">{formData.email || "-"}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span className="bp-review-label">Address</span>
                  <span className="bp-review-val" style={{ lineHeight: "1.4" }}>
                    {formData.address ? `${formData.address}${formData.city ? `, ${formData.city}` : ""}${formData.state ? `, ${formData.state}` : ""}${formData.pincode ? ` - ${formData.pincode}` : ""}` : "-"}
                  </span>
                </div>
                <div>
                  <span className="bp-review-label">Alternate Mobile Number</span>
                  <span className="bp-review-val">{formData.alternatePhone || "-"}</span>
                </div>
              </div>
            </div>

            {/* KYC Information Summary */}
            <div className="bp-review-section">
              <h4>KYC Documents & Assets</h4>
              <div className="bp-review-doc-list">
                <div className="bp-review-doc-item">
                  <div className="bp-review-doc-left">
                    <UserIcon />
                    <span>Customer Photo</span>
                  </div>
                  <div className="bp-review-doc-right">
                    <span>{formData.customerPhotoFile?.name || "Not uploaded"}</span>
                    {formData.customerPhotoFile && <div className="bp-file-check"><CheckIcon /></div>}
                  </div>
                </div>

                <div className="bp-review-doc-item">
                  <div className="bp-review-doc-left">
                    <EditIcon />
                    <span>Customer Signature</span>
                  </div>
                  <div className="bp-review-doc-right">
                    <span>{formData.customerSignatureFile?.name || "Not uploaded"}</span>
                    {formData.customerSignatureFile && <div className="bp-file-check"><CheckIcon /></div>}
                  </div>
                </div>

                <div className="bp-review-doc-item">
                  <div className="bp-review-doc-left">
                    <ShieldIcon />
                    <span>PAN Card</span>
                  </div>
                  <div className="bp-review-doc-right">
                    <span>{formData.panFile?.name || "Not uploaded"}</span>
                    {formData.panFile && <div className="bp-file-check"><CheckIcon /></div>}
                  </div>
                </div>

                <div className="bp-review-doc-item">
                  <div className="bp-review-doc-left">
                    <IdBadgeIcon />
                    <span>Aadhaar Front</span>
                  </div>
                  <div className="bp-review-doc-right">
                    <span>{formData.aadhaarFrontFile?.name || "Not uploaded"}</span>
                    {formData.aadhaarFrontFile && <div className="bp-file-check"><CheckIcon /></div>}
                  </div>
                </div>

                <div className="bp-review-doc-item">
                  <div className="bp-review-doc-left">
                    <IdBadgeIcon />
                    <span>Aadhaar Back</span>
                  </div>
                  <div className="bp-review-doc-right">
                    <span>{formData.aadhaarBackFile?.name || "Not uploaded"}</span>
                    {formData.aadhaarBackFile && <div className="bp-file-check"><CheckIcon /></div>}
                  </div>
                </div>

                <div className="bp-review-doc-item">
                  <div className="bp-review-doc-left">
                    <HomeIcon />
                    <span>Address Proof ({formData.addressProofType})</span>
                  </div>
                  <div className="bp-review-doc-right">
                    <span>{formData.addressProofFile?.name || "Not uploaded"}</span>
                    {formData.addressProofFile && <div className="bp-file-check"><CheckIcon /></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Alert Box */}
          <div className="bp-alert-box" style={{ marginTop: 14 }}>
            <InfoIcon />
            <span><strong>Please Confirm</strong><br />By adding this client, you confirm that all the provided information is correct and verified.</span>
          </div>

          {/* Footer Action Buttons */}
          <div className="bp-wizard-footer">
            <button type="button" className="bp-btn-outline" onClick={() => setStep(3)}>
              ← Back
            </button>
            <button type="button" className="bp-btn-solid" disabled={saving} onClick={handleFinalSubmit}>
              {saving ? "Adding..." : "+ Add Client"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
