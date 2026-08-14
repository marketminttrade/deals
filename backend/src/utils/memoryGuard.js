/**
 * Memory Guard Middleware & Helpers for Render Free Tier (512MB RAM Limit).
 *
 * Prevents abrupt OOM cgroup kills by checking heap usage before handling heavy operations.
 * Also configures garbage collection hints if available.
 */

// Default threshold: 85% of 380MB max heap size (~323MB)
const HEAP_THRESHOLD_BYTES = parseInt(process.env.MEMORY_THRESHOLD_MB || "323", 10) * 1024 * 1024;

/**
 * Middleware to reject non-essential requests when RAM usage is critically high.
 */
function memoryGuardMiddleware(req, res, next) {
  // Always allow health checks through
  if (req.path === "/health" || req.path === "/ping" || req.path === "/health/deep") {
    return next();
  }

  const memory = process.memoryUsage();

  if (memory.heapUsed > HEAP_THRESHOLD_BYTES) {
    console.warn(`⚠️ High memory usage detected: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB / Threshold: ${(HEAP_THRESHOLD_BYTES / 1024 / 1024).toFixed(2)} MB`);

    // Trigger GC if --expose-gc flag was enabled
    if (global.gc) {
      try {
        global.gc();
      } catch (e) {
        // Ignore GC failure
      }
    }

    return res.status(503).json({
      status: "error",
      message: "Server busy due to high memory pressure. Please try again shortly.",
    });
  }

  next();
}

/**
 * Setup global uncaught exception and unhandled rejection handlers.
 */
function setupProcessProtections(gracefulShutdown) {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Promise Rejection at:", promise, "reason:", reason);
    // Don't crash immediately for non-fatal rejections, but log clearly for monitoring
  });

  process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception thrown:", error);
    // Uncaught exceptions leave app in unpredictable state; initiate graceful shutdown
    if (gracefulShutdown) {
      gracefulShutdown("UNCAUGHT_EXCEPTION", 1);
    } else {
      process.exit(1);
    }
  });
}

module.exports = {
  memoryGuardMiddleware,
  setupProcessProtections,
};
