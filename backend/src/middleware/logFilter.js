/**
 * Custom request logger middleware / filter to suppress periodic health check logs in production.
 * Prevents log clutter on Render's dashboard caused by UptimeRobot 5-minute pings.
 */
function requestLogger(req, res, next) {
  const isHealthCheck = req.path === "/health" || req.path === "/ping" || req.path === "/api/health" || req.path === "/health/deep";
  const shouldSuppress = process.env.NODE_ENV === "production" || process.env.SUPPRESS_HEALTH_LOGS === "true";

  const start = Date.now();

  res.on("finish", () => {
    // Suppress successful health check logs (2xx/3xx) if configured to suppress
    if (isHealthCheck && shouldSuppress && res.statusCode < 400) {
      return;
    }

    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
}

module.exports = { requestLogger };
