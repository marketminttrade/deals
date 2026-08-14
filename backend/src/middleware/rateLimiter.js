/**
 * Ultra-lightweight in-memory rate limiter middleware for health check endpoints.
 * Prevents DoS/spam attacks on Render's vCPU without adding external npm dependencies.
 * Uses a sliding window with automatic garbage collection to preserve RAM on 512MB limit.
 */
function createHealthRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const maxRequests = options.maxRequests || 20; // 20 requests per window default
  const ipMap = new Map();

  // Periodically clean up expired entries every 5 minutes to prevent memory bloat
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipMap.entries()) {
      if (now - data.startTime > windowMs) {
        ipMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not block node process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function healthRateLimiter(req, res, next) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    let record = ipMap.get(ip);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      ipMap.set(ip, record);
      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      return res.status(429).json({
        status: "error",
        message: "Too many health check requests. Rate limit exceeded.",
        retryAfterSeconds: Math.ceil((windowMs - (now - record.startTime)) / 1000),
      });
    }

    next();
  };
}

module.exports = { createHealthRateLimiter };
