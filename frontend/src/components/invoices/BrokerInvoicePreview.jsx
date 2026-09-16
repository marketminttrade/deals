import { formatAmount, formatDate, formatCurrency } from "../../utils/formatters";
import { resolveAssetUrl } from "../../utils/assets";

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

export default function BrokerInvoicePreview({
  broker,
  client,
  trades,
  filters,
  summary,
  statementNumber,
  toggles = {},
}) {
  const invoiceTrades = trades || [];

  const logoUrl = broker?.branding?.logoUrl;
  const horizontalLogoUrl = broker?.branding?.horizontalLogoUrl;

  const stampUrl = resolveAssetUrl(broker?.branding?.stampUrl || broker?.branding?.trademarkUrl);
  const signatureUrl = resolveAssetUrl(broker?.branding?.signatureUrl);

  const brokerageHouseName = broker?.branding?.brokerageHouseName || broker?.name || "DHANLAXMI FINANCE";
  const tagline = broker?.branding?.tagline || "GROW WEALTH | SECURE FUTURE | PROSPER TOGETHER";
  const invNumber = statementNumber || `INV/2505/${String(Date.now()).slice(-6)}`;

  const clientName = client?.fullName || "-";
  const clientId = client?.clientCode || client?.idCode || "-";
  const clientAddress = client?.address || "-";
  const clientPhone = client?.phone || broker?.contact?.phone || "-";
  const clientEmail = client?.email || broker?.contact?.email || "-";

  const invoiceDate = filters?.toDate ? formatDate(filters.toDate) : formatDate(new Date());
  const tradeDate = filters?.toDate ? formatDate(filters.toDate) : formatDate(new Date());

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
  const isNetProfit = totalNetPnL >= 0;
  const isGrossProfit = totalGrossPnL >= 0;
  const totalTrades = summary?.totalTrades || invoiceTrades.length;
  const totalQty = invoiceTrades.reduce((acc, t) => acc + (Number(t.quantity || 1) * Number(t.lotSize || 1)), 0);

  // Toggle Visibility Defaults
  const showCharges = toggles.showChargesBreakup !== false;
  const showTax = toggles.showTaxSummary !== false;
  const showContact = toggles.showClientContact !== false;
  const showStamp = toggles.showStamp !== false;
  const showFooter = toggles.showFooterNotes !== false;

  return (
    <div className="invoice-preview-shell print-section" style={{ background: "#f8fafc", padding: "20px 0" }}>
      <div
        className="invoice-preview-card"
        style={{
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          background: "#ffffff",
          padding: 28,
          borderRadius: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          fontFamily: "'Inter', sans-serif",
          color: "#0f172a",
        }}
      >
        {/* ── Header: [LOGO] [LOGO-H] side by side ── */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logoUrl ? (
              <img src={resolveAssetUrl(logoUrl)} alt="Main Logo" style={{ height: 60, width: "auto", objectFit: "contain" }} />
            ) : null}

            {horizontalLogoUrl ? (
              <img src={resolveAssetUrl(horizontalLogoUrl)} alt={brokerageHouseName} style={{ height: 84, maxWidth: 380, objectFit: "contain" }} />
            ) : (
              <div>
                <h1 style={{ margin: 0, fontSize: "1.7rem", fontWeight: 800, color: "#0b2545", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {brokerageHouseName}
                </h1>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#c59b27", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginTop: 2 }}>
                  {tagline}
                </span>
              </div>
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, color: "#0b2545", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              INVOICE
            </h2>
            <div style={{ background: "#0b2545", color: "#fff", padding: "5px 16px", borderRadius: 16, fontWeight: 700, fontSize: "0.88rem", marginTop: 4, display: "inline-block", letterSpacing: "0.06em" }}>
              {invNumber}
            </div>
          </div>
        </header>

        {/* ── Top Meta Section (BILL TO | Metadata | SUMMARY) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.1fr", gap: 16, marginBottom: 20 }}>
          {/* Bill To */}
          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              BILL TO
            </span>
            <strong style={{ fontSize: "1.05rem", color: "#0b2545", display: "block" }}>{clientName}</strong>
            <span style={{ fontSize: "0.82rem", color: "#0b2545", fontWeight: 700, display: "block", margin: "2px 0 6px" }}>
              Client ID: {clientId}
            </span>
            {showContact && (
              <>
                <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#475569", lineHeight: "1.4" }}>
                  {clientAddress}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: "0.78rem", fontWeight: 700, color: "#0b2545" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    📞 {clientPhone}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    ✉️ {clientEmail}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Metadata */}
          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", display: "grid", gap: 10, alignContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.9rem" }}>📅</span>
              <div>
                <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>Invoice Date</span>
                <strong style={{ fontSize: "0.88rem", color: "#0b2545" }}>{invoiceDate}</strong>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.9rem" }}>📅</span>
              <div>
                <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>Trade Date</span>
                <strong style={{ fontSize: "0.88rem", color: "#0b2545" }}>{tradeDate}</strong>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.9rem" }}>💼</span>
              <div>
                <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>Financial Year</span>
                <strong style={{ fontSize: "0.88rem", color: "#0b2545" }}>2025-26</strong>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.9rem" }}>📍</span>
              <div>
                <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>Place of Supply</span>
                <strong style={{ fontSize: "0.88rem", color: "#0b2545" }}>Gujarat (24)</strong>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div style={{ border: "1px solid #0b2545", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ background: "#0b2545", color: "#fff", textAlign: "center", padding: "6px", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.08em" }}>
                SUMMARY
              </div>
              <div style={{ padding: "10px 12px", display: "grid", gap: 6, fontSize: "0.82rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Turnover</span>
                  <strong style={{ color: "#0b2545" }}>{formatCurrency(totalTurnover)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Trades</span>
                  <strong style={{ color: "#0b2545" }}>{totalTrades}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Charges (Brokerage)</span>
                  <strong style={{ color: "#0b2545" }}>{formatCurrency(totalBrokerage)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Tax (0.0%)</span>
                  <strong style={{ color: "#0b2545" }}>₹0.00</strong>
                </div>
              </div>
            </div>
            <div style={{ background: "#0b2545", color: "#fff", display: "flex", justifyContent: "space-between", padding: "8px 12px", fontWeight: 800, fontSize: "0.9rem" }}>
              <span>GRAND TOTAL</span>
              <span>{formatCurrency(totalBrokerage)}</span>
            </div>
          </div>
        </div>

        {/* ── Trading Summary Table ── */}
        <div style={{ border: "1px solid #0b2545", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ background: "#0b2545", color: "#fff", padding: "8px 12px", fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.08em" }}>
            TRADING SUMMARY
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#0b2545", color: "#ffffff", fontWeight: 700 }}>
                  <th style={{ padding: "8px 6px", textAlign: "center" }}>Sr. No.</th>
                  <th style={{ padding: "8px 6px", textAlign: "center" }}>Segment</th>
                  <th style={{ padding: "8px 6px", textAlign: "left" }}>Product</th>
                  <th style={{ padding: "8px 6px", textAlign: "left" }}>Symbol</th>
                  <th style={{ padding: "8px 6px", textAlign: "center" }}>Buy / Sell</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>Entry Price</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>Exit Price</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>Trade Value (₹)</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>Brokerage (₹)</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>P&L (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoiceTrades.length ? (
                  invoiceTrades.map((t, index) => {
                    const buyP = t.buyPrice ?? t.entryPrice ?? 0;
                    const sellP = t.sellPrice ?? t.exitPrice ?? buyP;
                    const units = Number(t.quantity || 1) * Number(t.lotSize || 1);
                    const tradeVal = t.totalBuy || (buyP * units);
                    const brk = t.charges?.brokerage || t.charges?.total || 0;
                    const pnl = t.netPnL || 0;
                    const isProfit = pnl >= 0;
                    const side = String(t.side || "buy").toUpperCase();

                    return (
                      <tr key={t._id || index} style={{ borderBottom: "1px solid #e2e8f0", background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                        <td style={{ padding: "7px 6px", textAlign: "center" }}>{index + 1}</td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: 600 }}>{segmentCode(t.segment, t.instrument)}</td>
                        <td style={{ padding: "7px 6px" }}>{productLabel(t.tradeMode, t.segment)}</td>
                        <td style={{ padding: "7px 6px", fontWeight: 700, color: "#0b2545" }}>{t.symbol || t.stockName}</td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: 700, color: side === "BUY" ? "#16a34a" : "#dc2626" }}>{side}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right" }}>{units}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right" }}>{formatAmount(buyP)}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right" }}>{formatAmount(sellP)}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right", fontWeight: 600 }}>{formatAmount(tradeVal)}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right" }}>{formatAmount(brk)}</td>
                        <td style={{ padding: "7px 6px", textAlign: "right", fontWeight: 700, color: isProfit ? "#16a34a" : "#dc2626" }}>
                          {formatAmount(pnl)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
                      No closed trades found for the selected client and date range.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: 800, borderTop: "2px solid #0b2545" }}>
                  <td colSpan={8} style={{ padding: "8px 12px", textAlign: "right", color: "#0b2545" }}>Totals</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: "#0b2545" }}>{formatAmount(totalTurnover)}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: "#0b2545" }}>{formatAmount(totalBrokerage)}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: isNetProfit ? "#16a34a" : "#dc2626" }}>
                    {isNetProfit ? "+" : ""}{formatAmount(totalNetPnL)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p style={{ margin: "-12px 0 16px", fontSize: "0.72rem", color: "#64748b", fontStyle: "italic" }}>
          Note: EQ - Equity, FUT - Futures, OPT - Options
        </p>

        {/* ── Middle Breakup Section (3 Columns) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* Box 1: CHARGES BREAKUP */}
          {showCharges ? (
            <div style={{ border: "1px solid #0b2545", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: "#0b2545", color: "#fff", padding: "6px 10px", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                CHARGES BREAKUP
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                    <th style={{ padding: "4px", textAlign: "center" }}>Sr.</th>
                    <th style={{ padding: "4px", textAlign: "left" }}>Particulars</th>
                    <th style={{ padding: "4px", textAlign: "center" }}>Exch.</th>
                    <th style={{ padding: "4px", textAlign: "right" }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "4px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "4px", fontWeight: 600 }}>Brokerage</td>
                    <td style={{ padding: "4px", textAlign: "center" }}>NSE</td>
                    <td style={{ padding: "4px", textAlign: "right" }}>{formatAmount(totalBrokerage)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "4px", textAlign: "center" }}>2</td>
                    <td style={{ padding: "4px" }}>Exchange Charges</td>
                    <td style={{ padding: "4px", textAlign: "center" }}>NSE</td>
                    <td style={{ padding: "4px", textAlign: "right" }}>0.00</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "4px", textAlign: "center" }}>3</td>
                    <td style={{ padding: "4px" }}>SEBI Charges</td>
                    <td style={{ padding: "4px", textAlign: "center" }}>NSE</td>
                    <td style={{ padding: "4px", textAlign: "right" }}>0.00</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "4px", textAlign: "center" }}>4</td>
                    <td style={{ padding: "4px" }}>GST (0.0%)</td>
                    <td style={{ padding: "4px", textAlign: "center" }}>NSE</td>
                    <td style={{ padding: "4px", textAlign: "right" }}>0.00</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px", textAlign: "center" }}>5</td>
                    <td style={{ padding: "4px" }}>Stamp Duty</td>
                    <td style={{ padding: "4px", textAlign: "center" }}>NSE</td>
                    <td style={{ padding: "4px", textAlign: "right" }}>0.00</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ background: "#f8fafc", padding: "6px 8px", borderTop: "1px solid #0b2545", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 800 }}>
                <span>Total Charges (Only Brokerage)</span>
                <span style={{ color: "#0b2545" }}>{formatCurrency(totalBrokerage)}</span>
              </div>
            </div>
          ) : <div />}

          {/* Box 2: TAX & TRANSACTION SUMMARY */}
          {showTax ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ border: "1px solid #0b2545", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ background: "#0b2545", color: "#fff", padding: "5px 10px", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                  TAX SUMMARY (0.0%)
                </div>
                <div style={{ padding: "8px 10px", fontSize: "0.75rem", display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Taxable Value</span><strong>{formatCurrency(totalBrokerage)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>GST (0.0%)</span><strong>₹0.00</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid #e2e8f0", paddingTop: 4 }}><span>Total Tax</span><strong>₹0.00</strong></div>
                </div>
              </div>

              <div style={{ border: "1px solid #0b2545", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ background: "#0b2545", color: "#fff", padding: "5px 10px", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                  TRANSACTION SUMMARY
                </div>
                <div style={{ padding: "8px 10px", fontSize: "0.72rem", display: "grid", gap: 3 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Segment</span><strong>Equity, F&O</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Exchange</span><strong>NSE</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Turnover</span><strong>{formatCurrency(totalTurnover)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Trades</span><strong>{totalTrades}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Qty</span><strong>{totalQty}</strong></div>
                </div>
              </div>
            </div>
          ) : <div />}

          {/* Box 3: AMOUNT SUMMARY */}
          <div style={{ border: "1px solid #0b2545", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ background: "#0b2545", color: "#fff", padding: "6px 10px", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                AMOUNT SUMMARY
              </div>
              <div style={{ padding: "12px 10px", display: "grid", gap: 6, fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Brokerage</span>
                  <strong>{formatCurrency(totalBrokerage)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Tax (0.0%)</span>
                  <strong>₹0.00</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 6 }}>
                  <span>Total Charges</span>
                  <strong>{formatCurrency(totalBrokerage)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 6 }}>
                  <span>Gross P&L</span>
                  <strong style={{ color: isGrossProfit ? "#16a34a" : "#dc2626" }}>
                    {isGrossProfit ? "+" : ""}{formatCurrency(totalGrossPnL)}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Net Trading P&L</span>
                  <strong style={{ color: isNetProfit ? "#16a34a" : "#dc2626" }}>
                    {isNetProfit ? "+" : ""}{formatCurrency(totalNetPnL)}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ background: "#0b2545", color: "#fff", padding: "10px", display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "0.95rem" }}>
              <span>NET P&L</span>
              <span style={{ color: isNetProfit ? "#4ade80" : "#f87171" }}>
                {isNetProfit ? "+" : ""}{formatCurrency(totalNetPnL)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer Columns (Market Insights / Support) ── */}
        {showFooter && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, padding: "16px 0", borderTop: "1.5px solid #e2e8f0", marginBottom: 20, fontSize: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 28, borderRadius: "50%", background: "#fdf8e1", border: "1px solid #c59b27", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>👍</div>
                <strong style={{ color: "#0b2545", fontSize: "0.82rem" }}>Thank You!</strong>
              </div>
              <p style={{ margin: 0, color: "#475569", lineHeight: "1.4", fontSize: "0.72rem" }}>
                Thank you for trading with {brokerageHouseName}. We value your trust and partnership.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 28, borderRadius: "50%", background: "#fdf8e1", border: "1px solid #c59b27", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>📊</div>
                <strong style={{ color: "#0b2545", fontSize: "0.82rem" }}>Market Insights</strong>
              </div>
              <p style={{ margin: 0, color: "#475569", lineHeight: "1.4", fontSize: "0.72rem" }}>
                Stay updated with market trends & expert research to make informed decisions.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 28, borderRadius: "50%", background: "#fdf8e1", border: "1px solid #c59b27", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>🎧</div>
                <strong style={{ color: "#0b2545", fontSize: "0.82rem" }}>Need Help?</strong>
              </div>
              <p style={{ margin: 0, color: "#475569", lineHeight: "1.4", fontSize: "0.72rem", wordBreak: "break-word" }}>
                Our support team is here to assist you with your trading queries.<br />
                {clientEmail}<br />
                {clientPhone !== "-" ? clientPhone : ""}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 28, borderRadius: "50%", background: "#fdf8e1", border: "1px solid #c59b27", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>🛡️</div>
                <strong style={{ color: "#0b2545", fontSize: "0.82rem" }}>Secure Trading</strong>
              </div>
              <p style={{ margin: 0, color: "#475569", lineHeight: "1.4", fontSize: "0.72rem" }}>
                Your security is our priority. Trade safe, trade with confidence.
              </p>
            </div>
          </div>
        )}

        {/* ── Official Stamp & Signature ── */}
        {showStamp && (
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 24, marginBottom: 16 }}>
            {stampUrl && (
              <div style={{ textAlign: "center" }}>
                <img src={stampUrl} alt="Official Seal" style={{ height: 60, objectFit: "contain" }} />
                <span style={{ fontSize: "0.65rem", color: "#64748b", display: "block", marginTop: 2 }}>Official Seal</span>
              </div>
            )}
            {signatureUrl && (
              <div style={{ textAlign: "center" }}>
                <img src={signatureUrl} alt="Authorized Signature" style={{ height: 44, objectFit: "contain" }} />
                <div style={{ borderTop: "1.5px solid #0b2545", marginTop: 4, paddingTop: 2, fontSize: "0.68rem", fontWeight: 700, color: "#0b2545" }}>
                  For, {brokerageHouseName} Pvt. Ltd.
                </div>
                <span style={{ fontSize: "0.65rem", color: "#64748b", display: "block" }}>Authorized Signatory</span>
              </div>
            )}
          </div>
        )}

        {/* ── Bottom Single-Line Footer Bar ── */}
        <footer style={{ background: "#0b2545", color: "#ffffff", padding: "10px 16px", borderRadius: 6, textAlign: "center", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em" }}>
          {tagline}
        </footer>
      </div>
    </div>
  );
}
