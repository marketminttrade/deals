import { jsPDF } from "jspdf";
import { resolveAssetUrl } from "./assets";

function cleanPdfText(val) {
  if (val === null || val === undefined) return "-";
  const str = String(val).replace(/₹/g, "INR ").replace(/\s+/g, " ").trim();
  return str || "-";
}

function formatCurrencyValue(value) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) {
    return "INR 0.00";
  }
  return `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatDateValue(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function urlToDataUrl(url) {
  if (!url) {
    return null;
  }
  try {
    const response = await fetch(resolveAssetUrl(url));
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getImageFormat(dataUrl) {
  if (!dataUrl) {
    return undefined;
  }
  return dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg") ? "JPEG" : "PNG";
}

function paintPageBackground(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function buildLegalLine(broker) {
  const legalName = String(broker?.legalName || "").trim();
  const baseName = legalName || broker?.branding?.brokerageHouseName || broker?.name || "Broker";
  if (/STOCK BROKERS PVT LTD\.?$/i.test(baseName)) {
    return baseName;
  }
  return `${baseName} STOCK BROKERS PVT LTD.`;
}

function fitLines(doc, value, width, maxLines = 2) {
  const cleanVal = cleanPdfText(value);
  const rawLines = doc.splitTextToSize(cleanVal, Math.max(width - 2, 24));
  if (rawLines.length <= maxLines) {
    return rawLines;
  }
  const lines = rawLines.slice(0, maxLines);
  const lastIndex = lines.length - 1;
  lines[lastIndex] = `${String(lines[lastIndex]).replace(/\.{0,3}$/, "")}...`;
  return lines;
}

function drawSectionTitle(doc, title, x, y, width) {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, width, 22, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, width, 22, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // Deep Navy
  doc.text(title.toUpperCase(), x + 10, y + 14);
}

function drawField(doc, { label, value, x, y, width, height, maxLines = 2 }) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105); // Cool Slate Gray
  doc.text(String(label).toUpperCase(), x, y);

  const lines = fitLines(doc, value, width, maxLines);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // Rich Dark Gray
  doc.text(lines, x, y + 12, { maxWidth: width });

  doc.setDrawColor(226, 232, 240);
  doc.line(x, y + height, x + width, y + height);
}

function drawRow(doc, fields, x, y, totalWidth, gap = 12) {
  const ratioTotal = fields.reduce((sum, field) => sum + (field.ratio || 1), 0);
  const availableWidth = totalWidth - gap * (fields.length - 1);
  const widths = fields.map((field) => (availableWidth * (field.ratio || 1)) / ratioTotal);
  const heights = fields.map((field, index) => {
    const lines = fitLines(doc, field.value, widths[index], field.maxLines || 2);
    return Math.max(field.minHeight || 24, 12 + lines.length * 10 + 4);
  });
  const rowHeight = Math.max(...heights);

  let cursorX = x;
  fields.forEach((field, index) => {
    drawField(doc, {
      label: field.label,
      value: field.value,
      x: cursorX,
      y,
      width: widths[index],
      height: rowHeight,
      maxLines: field.maxLines,
    });
    cursorX += widths[index] + gap;
  });

  return rowHeight;
}

function drawImageBox(doc, { image, label, x, y, width, height, border = true, padding = 6, placeholder = "Not uploaded" }) {
  if (label) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(String(label).toUpperCase(), x, y);
  }

  const frameY = label ? y + 5 : y;

  if (border) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, frameY, width, height, 6, 6, "F");
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, frameY, width, height, 6, 6, "S");
  }

  if (!image) {
    if (placeholder) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(placeholder, x + width / 2, frameY + height / 2, { align: "center" });
    }
    return frameY + height;
  }

  try {
    const props = doc.getImageProperties(image);
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const scale = Math.min(innerWidth / props.width, innerHeight / props.height);
    const renderWidth = props.width * scale;
    const renderHeight = props.height * scale;
    const renderX = x + padding + (innerWidth - renderWidth) / 2;
    const renderY = frameY + padding + (innerHeight - renderHeight) / 2;

    doc.addImage(image, getImageFormat(image), renderX, renderY, renderWidth, renderHeight, undefined, "FAST");
  } catch {
    if (placeholder) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Image Render Error", x + width / 2, frameY + height / 2, { align: "center" });
    }
  }

  return frameY + height;
}

function drawFooter(doc, broker, pageNum, totalPages = 2) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28;
  const y = pageHeight - 24;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y - 8, pageWidth - margin, y - 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  const contactLine = `${broker?.contact?.phone || ""}${broker?.contact?.phone && broker?.contact?.email ? " | " : ""}${broker?.contact?.email || ""}`.trim();
  doc.text(contactLine || "Broker Support Desk", margin, y);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, y, { align: "right" });
}

export async function downloadCustomerKycPdf({ broker, client }) {
  const kyc = client?.kyc || {};
  const fallbackNames = splitName(client?.fullName);
  const firstName = kyc.firstName || fallbackNames.firstName || "-";
  const lastName = kyc.lastName || fallbackNames.lastName || "-";
  const fatherName = kyc.fatherName || "-";
  const fullName = client?.fullName || `${firstName} ${lastName}`.trim();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;
  const contentWidth = pageWidth - margin * 2;
  const brokerageHouseName = broker?.branding?.brokerageHouseName || broker?.name || "Brokerage House";
  const legalLine = buildLegalLine(broker);

  const [
    logoImage,
    markImage,
    customerPhotoImage,
    customerSignatureImage,
    aadhaarFrontImage,
    aadhaarBackImage,
    panImage,
    bankProofImage,
  ] = await Promise.all([
    urlToDataUrl(broker?.branding?.logoUrl),
    urlToDataUrl(broker?.branding?.trademarkUrl),
    urlToDataUrl(kyc.customerPhotoUrl),
    urlToDataUrl(kyc.customerSignatureUrl),
    urlToDataUrl(kyc.aadhaarFrontUrl),
    urlToDataUrl(kyc.aadhaarBackUrl),
    urlToDataUrl(kyc.panImageUrl),
    urlToDataUrl(kyc.bankProofUrl || kyc.addressProofUrl),
  ]);

  // ════════════════════════════════════════════════════════════════════════
  // ── PAGE 1: APPLICANT PROFILE & REGISTRATION FORM
  // ════════════════════════════════════════════════════════════════════════
  paintPageBackground(doc);

  let y = margin;

  // Header Logo (2x Size: 80x80)
  const logoSize = 80;
  if (logoImage) {
    doc.addImage(logoImage, getImageFormat(logoImage), margin, y, logoSize, logoSize, undefined, "FAST");
  } else {
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, y, logoSize, logoSize, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text((broker?.branding?.logoText || "BR").slice(0, 2), margin + logoSize / 2, y + 48, { align: "center" });
  }

  // Header Titles offset after prominent logo
  const textX = margin + logoSize + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(brokerageHouseName, textX, y + 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text("KYC & CLIENT REGISTRATION FORM", textX, y + 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(legalLine, textX, y + 50);

  // Top Right Meta Box
  const refCode = client?.clientCode || client?.idCode || "REG";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`REF: KYC-${refCode}`, pageWidth - margin, y + 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`DATE: ${formatDateValue(kyc.applicationDate || new Date())}`, pageWidth - margin, y + 36, { align: "right" });

  y += logoSize + 14;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // ── SECTION A: APPLICANT PERSONAL DETAILS ──
  drawSectionTitle(doc, "1. Applicant Personal Details", margin, y, contentWidth);
  y += 28;

  const photoWidth = 96;
  const photoHeight = 114;
  const photoGap = 16;
  const leftWidth = contentWidth - photoWidth - photoGap;
  const photoX = margin + leftWidth + photoGap;
  let leftY = y;

  // 4-Part Name System
  leftY += drawRow(
    doc,
    [
      { label: "First Name", value: firstName },
      { label: "Last Name", value: lastName },
    ],
    margin,
    leftY,
    leftWidth
  ) + 10;

  leftY += drawRow(
    doc,
    [
      { label: "Father / Husband Name", value: fatherName, ratio: 1.2 },
      { label: "Full Name", value: fullName, ratio: 1.2 },
    ],
    margin,
    leftY,
    leftWidth
  ) + 10;

  leftY += drawRow(
    doc,
    [
      { label: "Date of Birth", value: formatDateValue(kyc.dateOfBirth), ratio: 1 },
      { label: "Gender", value: kyc.gender ? kyc.gender.toUpperCase() : "-", ratio: 0.8 },
      { label: "Application Date", value: formatDateValue(kyc.applicationDate), ratio: 1.1 },
    ],
    margin,
    leftY,
    leftWidth
  ) + 10;

  leftY += drawRow(
    doc,
    [
      { label: "Mobile Number", value: client?.phone, ratio: 1 },
      { label: "Email Address", value: client?.email, ratio: 1.3 },
    ],
    margin,
    leftY,
    leftWidth
  ) + 10;

  leftY += drawRow(
    doc,
    [
      { label: "Initial Deposit", value: formatCurrencyValue(kyc.initialDeposit || 0), ratio: 1 },
      { label: "Client ID / Code", value: refCode, ratio: 1 },
    ],
    margin,
    leftY,
    leftWidth
  ) + 10;

  // Photo Box on Right
  drawImageBox(doc, {
    image: customerPhotoImage,
    label: "Customer Photo",
    x: photoX,
    y,
    width: photoWidth,
    height: photoHeight,
    border: true,
    padding: 6,
    placeholder: "Passport Photo",
  });

  y = Math.max(leftY, y + photoHeight + 10);

  // Address Row spanning full width
  const fullAddressStr = [
    client?.address,
    kyc.city,
    kyc.state,
    kyc.pincode ? `- ${kyc.pincode}` : "",
  ].filter(Boolean).join(", ");

  y += drawRow(
    doc,
    [{ label: "Communication Address", value: fullAddressStr || "-", maxLines: 2, minHeight: 28 }],
    margin,
    y,
    contentWidth
  ) + 20;

  // ── SECTION B: FINANCIAL & RISK PROFILE ──
  drawSectionTitle(doc, "2. Financial & Risk Profile", margin, y, contentWidth);
  y += 28;

  y += drawRow(
    doc,
    [
      { label: "Occupation", value: cleanPdfText(kyc.occupation || "Business"), ratio: 1 },
      { label: "Annual Income", value: cleanPdfText(kyc.annualIncome || "Below 1,00,000"), ratio: 1.3 },
      { label: "Source of Funds", value: cleanPdfText(kyc.sourceOfFunds || "Salary"), ratio: 1 },
    ],
    margin,
    y,
    contentWidth
  ) + 12;

  y += drawRow(
    doc,
    [
      { label: "Nationality", value: cleanPdfText(kyc.nationality || "Indian"), ratio: 1 },
      { label: "PEP (Politically Exposed)", value: cleanPdfText(kyc.pep || "No"), ratio: 1 },
      { label: "Preferred Communication", value: cleanPdfText(kyc.preferredCommunication || "Email"), ratio: 1 },
    ],
    margin,
    y,
    contentWidth
  ) + 12;

  drawFooter(doc, broker, 1, 2);

  // ════════════════════════════════════════════════════════════════════════
  // ── PAGE 2: DOCUMENT ANNEXURE & DECLARATION
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  paintPageBackground(doc);

  y = margin;

  // Mini Header Page 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(brokerageHouseName, margin, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(37, 99, 235);
  doc.text("DOCUMENT ANNEXURE & DECLARATION", pageWidth - margin, y + 10, { align: "right" });

  y += 18;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // ── SECTION C: IDENTITY, BANK & ADDRESS VERIFICATION DETAILS ──
  drawSectionTitle(doc, "3. Identity, Bank & Address Verification Details", margin, y, contentWidth);
  y += 28;

  y += drawRow(
    doc,
    [
      { label: "PAN Number", value: cleanPdfText(kyc.panNumber || "-"), ratio: 1 },
      { label: "Aadhaar Number", value: cleanPdfText(kyc.aadhaarNumber || "-"), ratio: 1 },
      { label: "Address Proof Type", value: cleanPdfText(kyc.addressProofType || "Aadhaar Card"), ratio: 1 },
    ],
    margin,
    y,
    contentWidth
  ) + 10;

  y += drawRow(
    doc,
    [
      { label: "Bank Name", value: cleanPdfText(kyc.bankName || "-"), ratio: 1.2 },
      { label: "Account Number", value: cleanPdfText(kyc.accountNumber || "-"), ratio: 1 },
      { label: "IFSC Code", value: cleanPdfText(kyc.ifscCode || "-"), ratio: 0.9 },
      { label: "Account Type", value: cleanPdfText(kyc.bankAccountType || "Savings"), ratio: 0.8 },
    ],
    margin,
    y,
    contentWidth
  ) + 16;

  // ── SECTION D: SUPPORTING DOCUMENT IMAGES (2x2 GRID) ──
  drawSectionTitle(doc, "4. Uploaded Identity & Verification Documents", margin, y, contentWidth);
  y += 28;

  const gridGapX = 16;
  const gridGapY = 12;
  const cardWidth = (contentWidth - gridGapX) / 2;
  const cardHeight = 110;

  // Row 1: Aadhaar Front & Aadhaar Back
  drawImageBox(doc, {
    image: aadhaarFrontImage,
    label: "Aadhaar Front Image",
    x: margin,
    y,
    width: cardWidth,
    height: cardHeight,
    border: true,
    padding: 6,
    placeholder: "Aadhaar Front Image Not Uploaded",
  });

  drawImageBox(doc, {
    image: aadhaarBackImage,
    label: "Aadhaar Back Image",
    x: margin + cardWidth + gridGapX,
    y,
    width: cardWidth,
    height: cardHeight,
    border: true,
    padding: 6,
    placeholder: "Aadhaar Back Image Not Uploaded",
  });

  y += cardHeight + gridGapY + 10;

  // Row 2: PAN Card & Bank/Address Proof Image
  drawImageBox(doc, {
    image: panImage,
    label: "PAN Card Image",
    x: margin,
    y,
    width: cardWidth,
    height: cardHeight,
    border: true,
    padding: 6,
    placeholder: "PAN Card Image Not Uploaded",
  });

  drawImageBox(doc, {
    image: bankProofImage,
    label: "Bank / Address Proof Image",
    x: margin + cardWidth + gridGapX,
    y,
    width: cardWidth,
    height: cardHeight,
    border: true,
    padding: 6,
    placeholder: "Bank/Address Proof Image Not Uploaded",
  });

  y += cardHeight + gridGapY + 16;

  // ── SECTION E: LEGAL DECLARATION & SIGNATURES ──
  drawSectionTitle(doc, "5. Declaration & Signature", margin, y, contentWidth);
  y += 28;

  // Confirmation Container Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 36, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 36, 4, 4, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const declarationText = "I/We hereby declare that the details provided above and uploaded supporting documents are true and correct to the best of my knowledge and belief. I undertake to inform you of any changes therein immediately.";
  doc.text(doc.splitTextToSize(declarationText, contentWidth - 16), margin + 8, y + 14);

  y += 46;

  // Signatures Row
  const sigBoxWidth = 170;
  const sigBoxHeight = 52;

  // Customer Signature with Box
  drawImageBox(doc, {
    image: customerSignatureImage,
    label: "Applicant Signature",
    x: margin,
    y,
    width: sigBoxWidth,
    height: sigBoxHeight,
    border: true,
    padding: 4,
    placeholder: "Specimen Signature",
  });

  // Registered Stamp / Seal with TRANSPARENT BACKGROUND (border: false, no card fill)
  drawImageBox(doc, {
    image: markImage,
    label: "Registered Stamp / Seal",
    x: margin + sigBoxWidth + 30,
    y,
    width: sigBoxWidth,
    height: sigBoxHeight,
    border: false,
    padding: 0,
    placeholder: "",
  });

  drawFooter(doc, broker, 2, 2);

  const safeFileName = `${firstName}-${lastName}-${refCode}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");

  doc.save(`${safeFileName}-kyc-form.pdf`);
}
