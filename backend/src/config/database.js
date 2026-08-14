const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error("MONGO_URL is required to start the backend.");
  }

  try {
    await mongoose.connect(mongoUrl);
  } catch (error) {
    console.error("\n❌ MongoDB Connection Error:", error.message);
    console.error("👉 Please ensure MongoDB is running locally, or update MONGO_URL in `backend/.env` to your cloud MongoDB Atlas URI.\n");
    throw error;
  }
}

module.exports = { connectDatabase };
