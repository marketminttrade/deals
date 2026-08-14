const mongoose = require("mongoose");
const { setShuttingDown } = require("../middleware/healthCheck");

/**
 * Configures graceful shutdown handling for Node.js process.
 * Render sends SIGTERM prior to terminating or restarting containers.
 *
 * @param {import('http').Server} server - Express HTTP server instance
 * @param {object} [options]
 * @param {number} [options.timeoutMs=10000] - Hard shutdown safety timeout
 */
function setupGracefulShutdown(server, options = {}) {
  const timeoutMs = options.timeoutMs || 10000;

  async function handleShutdown(signal, exitCode = 0) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Step 1: Mark app as shutting down (causes shallow health check to return 503)
    setShuttingDown(true);

    // Step 2: Set safety fallback timer to force exit if connections hang
    const forceExitTimer = setTimeout(() => {
      console.error(`⌛ Graceful shutdown timed out after ${timeoutMs}ms. Forcefully exiting.`);
      process.exit(exitCode !== 0 ? exitCode : 1);
    }, timeoutMs);

    if (forceExitTimer.unref) {
      forceExitTimer.unref();
    }

    // Step 3: Stop accepting new HTTP connections
    if (server) {
      server.close((err) => {
        if (err) {
          console.error("Error closing HTTP server:", err);
        } else {
          console.log("✅ HTTP server closed. No longer accepting connections.");
        }
      });
    }

    // Step 4: Close database connection pool
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log("✅ MongoDB database connection closed gracefully.");
      }
    } catch (dbErr) {
      console.error("Error closing MongoDB connection:", dbErr.message);
    }

    clearTimeout(forceExitTimer);
    console.log("👋 Graceful shutdown complete. Exiting cleanly.\n");
    process.exit(exitCode);
  }

  // Register signal listeners
  process.on("SIGTERM", () => handleShutdown("SIGTERM", 0));
  process.on("SIGINT", () => handleShutdown("SIGINT", 0));

  return handleShutdown;
}

module.exports = { setupGracefulShutdown };
