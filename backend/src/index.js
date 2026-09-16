require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const { connectDatabase } = require("./config/database");
const { seedAdminUser } = require("./services/seedService");

const authRoutes = require("./routes/authRoutes");
const brokerAuthRoutes = require("./routes/brokerAuthRoutes");
const brokerRoutes = require("./routes/brokerRoutes");
const brokerPortalClientRoutes = require("./routes/brokerPortalClientRoutes");
const brokerPortalTradeRoutes = require("./routes/brokerPortalTradeRoutes");
const brokerPortalDashboardRoutes = require("./routes/brokerPortalDashboardRoutes");
const brokerPortalInvoiceRoutes = require("./routes/brokerPortalInvoiceRoutes");
const clientRoutes = require("./routes/clientRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const { requireAuth } = require("./middleware/requireAuth");
const { requireBrokerAuth } = require("./middleware/requireBrokerAuth");

// Production Readiness & Render Free Tier Utilities
const { shallowHealthCheck, deepHealthCheck } = require("./middleware/healthCheck");
const { createHealthRateLimiter } = require("./middleware/rateLimiter");
const { requestLogger } = require("./middleware/logFilter");
const { memoryGuardMiddleware, setupProcessProtections } = require("./utils/memoryGuard");
const { setupGracefulShutdown } = require("./utils/shutdown");

const app = express();
const PORT = process.env.PORT || 8000;
const uploadsDir = path.join(__dirname, "..", "uploads");

// Lightweight rate limiter for health check routes (20 req / minute per IP)
const healthLimiter = createHealthRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 });

// =================================--------------------------------------------
// PILLAR 1 & 2: FAST SHALLOW HEALTH ROUTE (Placed BEFORE heavy middlewares)
// =================================--------------------------------------------
app.get("/health", healthLimiter, shallowHealthCheck);
app.get("/ping", healthLimiter, shallowHealthCheck);
app.get("/api/health", healthLimiter, shallowHealthCheck);

// Protected Deep Health Route
app.get("/health/deep", deepHealthCheck);

// =================================--------------------------------------------
// PILLAR 2 & 4: MIDDLEWARES & RESOURCE PROTECTIONS
// =================================--------------------------------------------
app.use(requestLogger); // Log filter suppressing repetitive health check logs
app.use(memoryGuardMiddleware); // Rejects non-critical requests if RAM > 85% threshold
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// =================================--------------------------------------------
// APPLICATION ROUTES
// =================================--------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/broker-auth", brokerAuthRoutes);
app.use("/api/access", brokerAuthRoutes);
app.use("/api/brokers", requireAuth, brokerRoutes);
app.use("/api/clients", requireAuth, clientRoutes);
app.use("/api/trades", requireAuth, tradeRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/broker-portal/dashboard", requireBrokerAuth, brokerPortalDashboardRoutes);
app.use("/api/broker-portal/clients", requireBrokerAuth, brokerPortalClientRoutes);
app.use("/api/broker-portal/trades", requireBrokerAuth, brokerPortalTradeRoutes);
app.use("/api/broker-portal/invoices", requireBrokerAuth, brokerPortalInvoiceRoutes);

// =================================--------------------------------------------
// ERROR HANDLING MIDDLEWARE
// =================================--------------------------------------------
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Uploaded image is too large. Maximum size is 5MB." });
  }

  if (err.message === "Only image uploads are allowed." || err.message === "Invalid upload target.") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Cloudinary is not configured.") {
    return res.status(500).json({ message: err.message });
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {}).find((key) => key !== "brokerId") || "field";
    return res.status(409).json({ message: `${duplicateField} already exists.` });
  }

  if (err.name === "ValidationError") {
    const firstMessage = Object.values(err.errors || {})[0]?.message || "Validation failed.";
    return res.status(400).json({ message: firstMessage });
  }

  if (err.name === "TradeInputError") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({
    message: err.message || "Unexpected server error.",
  });
});

// =================================--------------------------------------------
// PILLAR 3 & 4: SERVER START & LIFECYCLE MANAGEMENT
// =================================--------------------------------------------
async function startServer() {
  await connectDatabase();
  await seedAdminUser();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Broker platform API running on http://0.0.0.0:${PORT}`);
  });

  // Setup graceful shutdown for Render redeployments (SIGTERM / SIGINT)
  const gracefulShutdown = setupGracefulShutdown(server, { timeoutMs: 10000 });

  // Setup uncaught exception & unhandled rejection listeners
  setupProcessProtections(gracefulShutdown);
}

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
});
