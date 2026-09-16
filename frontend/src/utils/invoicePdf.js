import { jsPDF } from "jspdf";
import { resolveAssetUrl } from "./assets";
import { formatAmount } from "./formatters";

async function urlToDataUrl(url) {
  if (!url) {
    return null;
  }

  try {
    let targetUrl = url;
    if (!url.startsWith("data:") && !url.startsWith("http") && !url.startsWith("blob:")) {
      if (url.startsWith("/media/") || url.startsWith("/fonts/") || url.startsWith("/static/")) {
        targetUrl = window.location.origin + url;
      } else {
        targetUrl = resolveAssetUrl(url);
      }
    }

    const response = await fetch(targetUrl);
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
  } catch (err) {
    return null;
  }
}

function getImageFormat(dataUrl) {
  if (!dataUrl) {
    return undefined;
  }

  return dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg") ? "JPEG" : "PNG";
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) return resolve(null);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function productLabel(mode, segment) {
  if (segment === "futures" || segment === "options" || segment === "FUT" || segment === "OPT") return "Intraday";
  if (mode === "cnc") return "Delivery";
  if (mode === "nrml") return "Carryforward";
  return "Intraday";
}

function segmentCode(seg, ins) {
  if (ins === "OPTIDX" || seg === "options") return "OPT";
  if (ins === "FUTSTK" || ins === "FUTIDX" || seg === "futures") return "FUT";
  return "EQ";
}

// Vector Icon Helpers
function drawPhoneIcon(doc, x, y, color = [11, 37, 69]) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, 7, 10, 1.5, 1.5, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 1, y + 2, 5, 6, "F");
}

function drawEmailIcon(doc, x, y, color = [11, 37, 69]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.rect(x, y, 10, 7, "S");
  doc.line(x, y, x + 5, y + 4);
  doc.line(x + 10, y, x + 5, y + 4);
}

function drawCalendarIcon(doc, x, y, color = [11, 37, 69]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y + 1, 10, 9, 1, 1, "S");
  doc.setFillColor(...color);
  doc.rect(x, y + 1, 10, 2.5, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 2, y, 1.5, 2, "F");
  doc.rect(x + 6.5, y, 1.5, 2, "F");
}

function drawBriefcaseIcon(doc, x, y, color = [11, 37, 69]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y + 2, 10, 7, 1, 1, "S");
  doc.rect(x + 3, y, 4, 2, "S");
}

function drawLocationIcon(doc, x, y, color = [11, 37, 69]) {
  doc.setFillColor(...color);
  doc.circle(x + 4, y + 3.5, 3.5, "F");
  doc.triangle(x + 1, y + 5, x + 7, y + 5, x + 4, y + 9.5, "F");
  doc.setFillColor(255, 255, 255);
  doc.circle(x + 4, y + 3.5, 1.2, "F");
}

function drawGoldBadgeIcon(doc, x, y, type) {
  doc.setFillColor(253, 248, 225);
  doc.setDrawColor(197, 155, 39);
  doc.setLineWidth(1);
  doc.circle(x + 10, y + 10, 10, "FD");

  doc.setDrawColor(197, 155, 39);
  doc.setFillColor(197, 155, 39);
  if (type === "thankyou") {
    doc.setLineWidth(1.5);
    doc.line(x + 6, y + 10, x + 9, y + 13);
    doc.line(x + 9, y + 13, x + 14, y + 7);
  } else if (type === "insights") {
    doc.rect(x + 6, y + 11, 2, 4, "F");
    doc.rect(x + 9, y + 8, 2, 7, "F");
    doc.rect(x + 12, y + 6, 2, 9, "F");
  } else if (type === "help") {
    doc.setLineWidth(1.2);
    doc.circle(x + 10, y + 9, 3.5, "S");
    doc.rect(x + 6, y + 8, 2, 4, "F");
    doc.rect(x + 12, y + 8, 2, 4, "F");
  } else {
    doc.roundedRect(x + 7, y + 9, 6, 5, 1, 1, "F");
    doc.setLineWidth(1);
    doc.circle(x + 10, y + 8, 2, "S");
  }
}

export async function downloadBrokerInvoicePdf({
  broker,
  client,
  trades,
  filters,
  summary,
  statementNumber,
  toggles = {},
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89
  const margin = 20;
  const usableWidth = pageWidth - margin * 2; // 555.28

  const invoiceTrades = trades || [];

  // Toggle Visibility Defaults
  const showCharges = toggles.showChargesBreakup !== false;
  const showTax = toggles.showTaxSummary !== false;
  const showContact = toggles.showClientContact !== false;
  const showStamp = toggles.showStamp !== false;
  const showFooter = toggles.showFooterNotes !== false;

  const brokerageHouseName = broker?.branding?.brokerageHouseName || broker?.name || "DHANLAXMI FINANCE";
  const tagline = broker?.branding?.tagline || "GROW WEALTH | SECURE FUTURE | PROSPER TOGETHER";
  const invNumber = statementNumber || `INV/2505/${String(Date.now()).slice(-6)}`;

  const clientName = client?.fullName || "-";
  const clientId = client?.clientCode || client?.idCode || "-";
  const clientAddress = client?.address || "-";
  const clientPhone = client?.phone || broker?.contact?.phone || "-";
  const clientEmail = client?.email || broker?.contact?.email || "-";

  const invoiceDate = filters?.toDate ? new Date(filters.toDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const tradeDate = filters?.toDate ? new Date(filters.toDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Calculate totals
  const totalTurnover = summary?.turnover || summary?.totalBuy || invoiceTrades.reduce((acc, t) => {
    const units = Number(t.quantity || 1) * Number(t.lotSize || 1);
    const buyP = Number(t.buyPrice ?? t.entryPrice ?? 0);
    const sellP = Number(t.sellPrice ?? t.exitPrice ?? buyP);
    return acc + (t.totalBuy || (buyP * units + sellP * units));
  }, 0);
  const totalBrokerage = summary?.totalBrokerage || invoiceTrades.reduce((acc, t) => acc + (t.charges?.brokerage || t.charges?.total || 0), 0);
  const totalGrossPnL = summary?.grossPnL !== undefined ? summary.grossPnL : invoiceTrades.reduce((acc, t) => acc + (t.grossPnL || 0), 0);
  const totalNetPnL = summary?.netPnL !== undefined ? summary.netPnL : invoiceTrades.reduce((acc, t) => acc + (t.netPnL || 0), 0);
  const totalTrades = summary?.totalTrades || invoiceTrades.length;
  const totalQty = invoiceTrades.reduce((acc, t) => acc + (Number(t.quantity || 1) * Number(t.lotSize || 1)), 0);

  // Directly fetch branding assets from Admin Panel settings (no static fallback)
  const logoUrl = broker?.branding?.logoUrl;
  const horizontalLogoUrl = broker?.branding?.horizontalLogoUrl;

  const [logoData, horizontalLogoData, stampImage, signatureImage] = await Promise.all([
    urlToDataUrl(logoUrl),
    urlToDataUrl(horizontalLogoUrl),
    urlToDataUrl(broker?.branding?.stampUrl || broker?.branding?.trademarkUrl),
    urlToDataUrl(broker?.branding?.signatureUrl),
  ]);

  const [squareDims, horizDims] = await Promise.all([
    getImageDimensions(logoData),
    getImageDimensions(horizontalLogoData),
  ]);

  let y = margin;

  // Background white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ── 1. HEADER (Renders [LOGO] and [LOGO-H] side by side) ──
  let curHeaderX = margin;

  // Render MAIN LOGO [LOGO] (Prominent & bigger)
  let mainLogoW = 0;
  if (logoData && squareDims) {
    const mainLogoH = 60; // Prominent size
    const aspect = squareDims.width / squareDims.height;
    mainLogoW = mainLogoH * aspect;
    if (mainLogoW > 70) mainLogoW = 70;
    try {
      doc.addImage(logoData, getImageFormat(logoData), curHeaderX, y + 10, mainLogoW, mainLogoH, undefined, "FAST");
      curHeaderX += mainLogoW + 12;
    } catch (e) {
      mainLogoW = 0;
    }
  }

  // Render HORIZONTAL LOGO [LOGO-H] or House Name / Tagline Text
  if (horizontalLogoData && horizDims) {
    const maxH = 84;
    const maxW = 380;
    const aspect = horizDims.width / horizDims.height;
    let renderW = maxH * aspect;
    let renderH = maxH;
    if (renderW > maxW) {
      renderW = maxW;
      renderH = maxW / aspect;
    }
    try {
      doc.addImage(horizontalLogoData, getImageFormat(horizontalLogoData), curHeaderX, y, renderW, renderH, undefined, "FAST");
    } catch (e) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(11, 37, 69);
      doc.text(brokerageHouseName, curHeaderX, y + 22);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(197, 155, 39);
      doc.text(tagline, curHeaderX, y + 36);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(11, 37, 69);
    doc.text(brokerageHouseName, curHeaderX, y + 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(197, 155, 39);
    doc.text(tagline, curHeaderX, y + 36);
  }

  // Right side: INVOICE title & Navy Pill Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(11, 37, 69);
  doc.text("INVOICE", pageWidth - margin, y + 24, { align: "right" });

  // Navy Pill Badge
  doc.setFillColor(11, 37, 69);
  doc.roundedRect(pageWidth - margin - 130, y + 32, 130, 20, 5, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(invNumber, pageWidth - margin - 65, y + 45, { align: "center" });

  y += 88;

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // ── 2. TOP INFO GRID (3 Columns) ──
  const colGap = 12;
  const col1Width = 190;
  const col2Width = 160;
  const col3Width = usableWidth - col1Width - col2Width - colGap * 2; // ~183pt

  // Col 1: BILL TO Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, col1Width, 92, 6, 6, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, col1Width, 92, 6, 6, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("BILL TO", margin + 10, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(11, 37, 69);
  doc.text(clientName, margin + 10, y + 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`Client ID: ${clientId}`, margin + 10, y + 40);

  if (showContact) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const addrLines = doc.splitTextToSize(clientAddress, col1Width - 20);
    doc.text(addrLines, margin + 10, y + 51);

    // Phone & Email with icons
    const contactY = y + 78;
    drawPhoneIcon(doc, margin + 10, contactY - 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(11, 37, 69);
    doc.text(clientPhone, margin + 21, contactY);

    drawEmailIcon(doc, margin + 85, contactY - 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(11, 37, 69);
    const safeEmail = clientEmail.length > 18 ? clientEmail.slice(0, 16) + "..." : clientEmail;
    doc.text(safeEmail, margin + 99, contactY);
  }

  // Col 2: METADATA Card
  const col2X = margin + col1Width + colGap;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, col2Width, 92, 6, 6, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, y, col2Width, 92, 6, 6, "S");

  const metaItems = [
    { label: "Invoice Date", val: invoiceDate, icon: "calendar" },
    { label: "Trade Date", val: tradeDate, icon: "calendar" },
    { label: "Financial Year", val: "2025-26", icon: "briefcase" },
    { label: "Place of Supply", val: "Gujarat (24)", icon: "location" },
  ];

  metaItems.forEach((item, idx) => {
    const itemY = y + 14 + idx * 20;

    if (item.icon === "calendar") drawCalendarIcon(doc, col2X + 10, itemY - 6);
    else if (item.icon === "briefcase") drawBriefcaseIcon(doc, col2X + 10, itemY - 6);
    else if (item.icon === "location") drawLocationIcon(doc, col2X + 10, itemY - 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, col2X + 24, itemY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(11, 37, 69);
    doc.text(item.val, col2X + 24, itemY + 10);
  });

  // Col 3: SUMMARY Box Card
  const col3X = col2X + col2Width + colGap;
  doc.setDrawColor(11, 37, 69);
  doc.setLineWidth(1);
  doc.roundedRect(col3X, y, col3Width, 92, 6, 6, "S");

  // Top Header Banner
  doc.setFillColor(11, 37, 69);
  doc.rect(col3X, y, col3Width, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("SUMMARY", col3X + col3Width / 2, y + 11, { align: "center" });

  // Rows inside summary
  const sumRows = [
    { label: "Total Turnover", val: formatAmount(totalTurnover) },
    { label: "Total Trades", val: String(totalTrades) },
    { label: "Total Charges (Brokerage)", val: formatAmount(totalBrokerage) },
    { label: "Total Tax (0.0%)", val: "0.00" },
  ];

  sumRows.forEach((sr, idx) => {
    const sY = y + 27 + idx * 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(sr.label, col3X + 8, sY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(11, 37, 69);
    doc.text(sr.val, col3X + col3Width - 8, sY, { align: "right" });
  });

  // Bottom Grand Total Banner
  doc.setFillColor(11, 37, 69);
  doc.rect(col3X, y + 74, col3Width, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL", col3X + 8, y + 86);
  doc.setFont("helvetica", "bold");
  doc.text(formatAmount(totalBrokerage), col3X + col3Width - 8, y + 86, { align: "right" });

  y += 104;

  // ── 3. TRADING SUMMARY TABLE (11 Columns) ──
  const tableColumns = [
    { label: "Sr. No.", width: 22, align: "center" },
    { label: "Segment", width: 34, align: "center" },
    { label: "Product", width: 42, align: "left" },
    { label: "Symbol", width: 82, align: "left" },
    { label: "Buy / Sell", width: 36, align: "center" },
    { label: "Qty", width: 28, align: "right" },
    { label: "Entry Price", width: 46, align: "right" },
    { label: "Exit Price", width: 46, align: "right" },
    { label: "Trade Value (INR)", width: 76, align: "right" },
    { label: "Brokerage (INR)", width: 58, align: "right" },
    { label: "P&L (INR)", width: 85.28, align: "right" },
  ];

  // Top Rounded Table Banner
  doc.setFillColor(11, 37, 69);
  doc.roundedRect(margin, y, usableWidth, 15, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("TRADING SUMMARY", margin + 10, y + 10);

  y += 15;

  // Header Row - SOLID DARK NAVY (#0B2545)
  doc.setFillColor(11, 37, 69);
  doc.rect(margin, y, usableWidth, 15, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  tableColumns.forEach((col) => {
    const txtX = col.align === "right" ? curX + col.width - 4 : col.align === "center" ? curX + col.width / 2 : curX + 4;
    doc.text(col.label, txtX, y + 10, { align: col.align });
    curX += col.width;
  });

  y += 15;

  // Table Body Rows
  if (invoiceTrades.length) {
    invoiceTrades.forEach((t, index) => {
      const buyP = t.buyPrice ?? t.entryPrice ?? 0;
      const sellP = t.sellPrice ?? t.exitPrice ?? buyP;
      const units = Number(t.quantity || 1) * Number(t.lotSize || 1);
      const tradeVal = t.totalBuy || buyP * units;
      const brk = t.charges?.brokerage || t.charges?.total || 0;
      const pnl = t.netPnL || 0;
      const isProfit = pnl >= 0;
      const side = String(t.side || "buy").toUpperCase();

      const rowBg = index % 2 === 0 ? 255 : 248;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(margin, y, usableWidth, 14, "F");

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 14, margin + usableWidth, y + 14);

      curX = margin;
      const rowValues = [
        { val: String(index + 1), align: "center", font: "helvetica", color: [15, 23, 42] },
        { val: segmentCode(t.segment, t.instrument), align: "center", font: "helvetica", color: [15, 23, 42] },
        { val: productLabel(t.tradeMode, t.segment), align: "left", font: "helvetica", color: [15, 23, 42] },
        { val: t.symbol || t.stockName || "-", align: "left", font: "helvetica", color: [11, 37, 69], bold: true },
        { val: side, align: "center", font: "helvetica", color: side === "BUY" ? [22, 163, 74] : [220, 38, 38], bold: true },
        { val: String(units), align: "right", font: "helvetica", color: [15, 23, 42] },
        { val: formatAmount(buyP), align: "right", font: "helvetica", color: [15, 23, 42] },
        { val: formatAmount(sellP), align: "right", font: "helvetica", color: [15, 23, 42] },
        { val: formatAmount(tradeVal), align: "right", font: "helvetica", color: [15, 23, 42] },
        { val: formatAmount(brk), align: "right", font: "helvetica", color: [15, 23, 42] },
        { val: formatAmount(pnl), align: "right", font: "helvetica", color: isProfit ? [22, 163, 74] : [220, 38, 38], bold: true },
      ];

      tableColumns.forEach((col, cIdx) => {
        const cell = rowValues[cIdx];
        doc.setFont(cell.font, cell.bold ? "bold" : "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(cell.color[0], cell.color[1], cell.color[2]);

        const txtX = col.align === "right" ? curX + col.width - 4 : col.align === "center" ? curX + col.width / 2 : curX + 4;
        doc.text(cell.val, txtX, y + 10, { align: col.align });
        curX += col.width;
      });

      y += 14;
    });
  } else {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, usableWidth, 20, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("No closed trades found for the selected client and date range.", margin + usableWidth / 2, y + 13, { align: "center" });
    y += 20;
  }

  // Table Totals Footer Row
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, usableWidth, 15, "F");
  doc.setDrawColor(11, 37, 69);
  doc.line(margin, y, margin + usableWidth, y);
  doc.line(margin, y + 15, margin + usableWidth, y + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(11, 37, 69);
  doc.text("Totals", margin + 336 - 4, y + 11, { align: "right" });

  doc.text(formatAmount(totalTurnover), margin + 412 - 4, y + 11, { align: "right" });
  doc.text(formatAmount(totalBrokerage), margin + 470 - 4, y + 11, { align: "right" });

  if (totalNetPnL >= 0) {
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(`${totalNetPnL >= 0 ? "+" : ""}${formatAmount(totalNetPnL)}`, margin + usableWidth - 4, y + 11, { align: "right" });

  y += 20;

  // Footnote
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("Note: EQ - Equity, FUT - Futures, OPT - Options", margin, y);

  y += 14;

  // ── 4. MIDDLE BREAKUP SECTION (3 Columns) ──
  const footerBarY = pageHeight - 26;
  if (y + 120 > footerBarY - 10) {
    doc.addPage();
    y = margin + 10;
  }

  const bColWidth = (usableWidth - colGap * 2) / 3; // ~177pt
  const midBoxHeight = 110;

  // Box 1: CHARGES BREAKUP
  if (showCharges) {
    const b1X = margin;
    doc.setDrawColor(11, 37, 69);
    doc.roundedRect(b1X, y, bColWidth, midBoxHeight, 6, 6, "S");

    doc.setFillColor(11, 37, 69);
    doc.rect(b1X, y, bColWidth, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("CHARGES BREAKUP", b1X + 8, y + 10);

    const chargeItems = [
      { sr: "1", name: "Brokerage", exch: "NSE", amt: formatAmount(totalBrokerage) },
      { sr: "2", name: "Exchange Charges", exch: "NSE", amt: "0.00" },
      { sr: "3", name: "SEBI Charges", exch: "NSE", amt: "0.00" },
      { sr: "4", name: "GST (0.0%)", exch: "NSE", amt: "0.00" },
      { sr: "5", name: "Stamp Duty", exch: "NSE", amt: "0.00" },
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    chargeItems.forEach((ci, cIdx) => {
      const cY = y + 25 + cIdx * 12;
      doc.setTextColor(100, 116, 139);
      doc.text(ci.sr, b1X + 8, cY);
      doc.setTextColor(15, 23, 42);
      doc.text(ci.name, b1X + 22, cY);
      doc.setTextColor(100, 116, 139);
      doc.text(ci.exch, b1X + 110, cY);
      doc.setTextColor(15, 23, 42);
      doc.text(ci.amt, b1X + bColWidth - 8, cY, { align: "right" });
    });

    doc.setFillColor(248, 250, 252);
    doc.rect(b1X, y + 92, bColWidth, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(11, 37, 69);
    doc.text("Total Charges (Only Brokerage)", b1X + 8, y + 104);
    doc.setFont("helvetica", "bold");
    doc.text(formatAmount(totalBrokerage), b1X + bColWidth - 8, y + 104, { align: "right" });
  }

  // Box 2: TAX & TRANSACTION SUMMARY
  if (showTax) {
    const b2X = margin + bColWidth + colGap;

    // Sub Box A: Tax Summary
    doc.setDrawColor(11, 37, 69);
    doc.roundedRect(b2X, y, bColWidth, 46, 6, 6, "S");
    doc.setFillColor(11, 37, 69);
    doc.rect(b2X, y, bColWidth, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("TAX SUMMARY (0.0%)", b2X + 8, y + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text("Taxable Value", b2X + 8, y + 23);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(formatAmount(totalBrokerage), b2X + bColWidth - 8, y + 23, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("GST (0.0%)", b2X + 8, y + 36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("0.00", b2X + bColWidth - 8, y + 36, { align: "right" });

    // Sub Box B: Transaction Summary
    const b2SubY = y + 52;
    doc.setDrawColor(11, 37, 69);
    doc.roundedRect(b2X, b2SubY, bColWidth, 58, 6, 6, "S");
    doc.setFillColor(11, 37, 69);
    doc.rect(b2X, b2SubY, bColWidth, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("TRANSACTION SUMMARY", b2X + 8, b2SubY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Segment", b2X + 8, b2SubY + 21);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Equity, Futures & Options", b2X + bColWidth - 8, b2SubY + 21, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Exchange", b2X + 8, b2SubY + 31);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("NSE", b2X + bColWidth - 8, b2SubY + 31, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Total Trades", b2X + 8, b2SubY + 41);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(totalTrades), b2X + bColWidth - 8, b2SubY + 41, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Total Qty", b2X + 8, b2SubY + 51);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(totalQty), b2X + bColWidth - 8, b2SubY + 51, { align: "right" });
  }

  // Box 3: AMOUNT SUMMARY
  const b3X = margin + (bColWidth + colGap) * 2;
  doc.setDrawColor(11, 37, 69);
  doc.roundedRect(b3X, y, bColWidth, midBoxHeight, 6, 6, "S");

  doc.setFillColor(11, 37, 69);
  doc.rect(b3X, y, bColWidth, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("AMOUNT SUMMARY", b3X + 8, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("Total Brokerage", b3X + 8, y + 25);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(formatAmount(totalBrokerage), b3X + bColWidth - 8, y + 25, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Total Tax (0.0%)", b3X + 8, y + 36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("0.00", b3X + bColWidth - 8, y + 36, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(11, 37, 69);
  doc.text("Total Charges", b3X + 8, y + 48);
  doc.text(formatAmount(totalBrokerage), b3X + bColWidth - 8, y + 48, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(b3X + 6, y + 53, b3X + bColWidth - 6, y + 53);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Gross P&L", b3X + 8, y + 64);
  doc.setFont("helvetica", "bold");
  if (totalGrossPnL >= 0) {
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(`${totalGrossPnL >= 0 ? "+" : ""}${formatAmount(totalGrossPnL)}`, b3X + bColWidth - 8, y + 64, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Net Trading P&L", b3X + 8, y + 76);
  doc.setFont("helvetica", "bold");
  if (totalNetPnL >= 0) {
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(`${totalNetPnL >= 0 ? "+" : ""}${formatAmount(totalNetPnL)}`, b3X + bColWidth - 8, y + 76, { align: "right" });

  // Grand Total Banner
  doc.setFillColor(11, 37, 69);
  doc.rect(b3X, y + 92, bColWidth, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("NET P&L", b3X + 8, y + 104);
  doc.setFont("helvetica", "bold");
  if (totalNetPnL >= 0) {
    doc.setTextColor(74, 222, 128);
  } else {
    doc.setTextColor(248, 113, 113);
  }
  doc.text(`${totalNetPnL >= 0 ? "+" : ""}${formatAmount(totalNetPnL)}`, b3X + bColWidth - 8, y + 104, { align: "right" });

  y += 122;

  // ── 5. VALUE PROPOSITION BADGES (4 Columns) ──
  if (showFooter) {
    const badgeWidth = (usableWidth - colGap * 3) / 4; // ~129.8pt
    const badges = [
      {
        title: "Thank You!",
        desc: [
          `Thank you for trading with`,
          `${brokerageHouseName}.`,
          `We value your trust and`,
          `partnership.`
        ],
        type: "thankyou",
      },
      {
        title: "Market Insights",
        desc: [
          "Stay updated with market",
          "trends & expert research to",
          "make informed decisions."
        ],
        type: "insights",
      },
      {
        title: "Need Help?",
        desc: [
          "Our support team is here to",
          "assist you with your queries.",
          clientEmail,
          clientPhone !== "-" ? clientPhone : ""
        ].filter(Boolean),
        type: "help",
      },
      {
        title: "Secure Trading",
        desc: [
          "Your security is our priority.",
          "Trade safe, trade with",
          "confidence."
        ],
        type: "secure",
      },
    ];

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + usableWidth, y);
    y += 10;

    badges.forEach((b, idx) => {
      const bdgX = margin + idx * (badgeWidth + colGap);

      // Gold badge icon
      drawGoldBadgeIcon(doc, bdgX, y, b.type);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(11, 37, 69);
      doc.text(b.title, bdgX + 24, y + 13);

      let curDescY = y + 28;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);

      b.desc.forEach((textLine) => {
        const wrapped = doc.splitTextToSize(textLine, badgeWidth - 2);
        wrapped.forEach((line) => {
          doc.text(line, bdgX, curDescY);
          curDescY += 8.5;
        });
      });
    });

    y += 60;
  }

  // ── 6. OFFICIAL STAMP & AUTHORIZED SIGNATURE ──
  if (showStamp) {
    const alignY = y;
    const stampX = pageWidth - margin - 150;
    const sigX = pageWidth - margin - 75;

    // Official Stamp Image
    if (stampImage) {
      try {
        doc.addImage(stampImage, getImageFormat(stampImage), stampX, alignY - 10, 48, 48, undefined, "FAST");
      } catch (e) {
        // fallback
      }
    }

    // Authorized Signature Image
    if (signatureImage) {
      try {
        doc.addImage(signatureImage, getImageFormat(signatureImage), sigX, alignY - 8, 65, 26, undefined, "FAST");
      } catch (e) {
        // fallback
      }
    }

    // Underline and Caption
    doc.setDrawColor(11, 37, 69);
    doc.setLineWidth(1);
    doc.line(sigX - 10, alignY + 20, pageWidth - margin, alignY + 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(11, 37, 69);
    doc.text(`For, ${brokerageHouseName} Pvt. Ltd.`, pageWidth - margin, alignY + 28, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Authorized Signatory & Seal", pageWidth - margin, alignY + 36, { align: "right" });
  }

  // ── 7. CLEAN LEGAL FOOTER BAR (Single Line, No Extra Text, on all pages) ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(11, 37, 69);
    doc.rect(0, footerBarY, pageWidth, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(tagline, pageWidth / 2, footerBarY + 16, { align: "center" });
  }

  const safeName = `${clientName}-${invNumber}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  doc.save(`${safeName}.pdf`);
}
