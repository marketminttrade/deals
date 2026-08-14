const mongoose = require("mongoose");

// Shutdown state flag managed by graceful shutdown logic
let isShuttingDown = false;

function setShuttingDown(val) {
  isShuttingDown = val;
}

function getShuttingDown() {
  return isShuttingDown;
}

/**
 * Shallow Health Check (/health or /ping)
 * - Under 5ms response time
 * - Zero DB / heavy middleware invocation
 * - Returns 503 if server is in shutdown mode
 */
function shallowHealthCheck(req, res) {
  if (isShuttingDown) {
    return res.status(503).json({
      status: "shutting_down",
      message: "Server is undergoing graceful shutdown.",
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper to format bytes to MB
 */
function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Protected Deep Health Check (/health/deep)
 * - Verifies database connection status
 * - Reports process memory usage & uptime
 * - Requires authorization token (Header x-health-token or Query ?token=)
 */
async function deepHealthCheck(req, res) {
  const secretToken = process.env.HEALTH_CHECK_SECRET;
  const providedToken = req.headers["x-health-token"] || req.query.token;

  if (secretToken && providedToken !== secretToken) {
    return res.status(401).json({
      status: "unauthorized",
      message: "Invalid or missing health check secret token.",
    });
  }

  const memory = process.memoryUsage();

  // Mongoose connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  // Postgres alternative check example if using pg pool:
  // let isDbConnected = false;
  // try { await pool.query('SELECT 1'); isDbConnected = true; } catch (e) {}

  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const healthData = {
    status: isDbConnected && !isShuttingDown ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    database: {
      type: "MongoDB",
      status: dbStatusMap[dbState] || "unknown",
      readyState: dbState,
    },
    memory: {
      rss: formatMB(memory.rss),
      heapTotal: formatMB(memory.heapTotal),
      heapUsed: formatMB(memory.heapUsed),
      external: formatMB(memory.external),
    },
    environment: process.env.NODE_ENV || "development",
  };

  if (!isDbConnected || isShuttingDown) {
    return res.status(503).json(healthData);
  }

  return res.status(200).json(healthData);
}

module.exports = {
  shallowHealthCheck,
  deepHealthCheck,
  setShuttingDown,
  getShuttingDown,
};
