const fs = require("fs/promises");
const Client = require("../models/Client");
const Trade = require("../models/Trade");
const { destroyImages } = require("../config/cloudinary");
const { getCustomerUploadDir } = require("../config/upload");

const RETENTION_MS = 72 * 60 * 60 * 1000;
const PURGE_INTERVAL_MS = 15 * 60 * 1000;
const KYC_ASSET_FIELDS = ["aadhaarFrontPublicId", "aadhaarBackPublicId", "panImagePublicId", "customerPhotoPublicId", "customerSignaturePublicId", "addressProofPublicId", "bankProofPublicId"];

function expiresAt(deletedAt) {
  return new Date(new Date(deletedAt).getTime() + RETENTION_MS);
}

// Retain the client and asset IDs until cleanup succeeds. Repeated cleanup is safe.
async function permanentlyDeleteClient(brokerId, clientId, cutoff = null) {
  const eligibility = cutoff ? { $or: [{ deletedAt: { $lte: cutoff } }, { purgeStartedAt: { $ne: null } }] } : {};
  const client = await Client.findOneAndUpdate(
    { _id: clientId, brokerId, isDeleted: true, ...eligibility },
    { $set: { purgeStartedAt: new Date() } },
    { new: true }
  );
  if (!client) return false;
  await destroyImages(KYC_ASSET_FIELDS.map((field) => client.kyc?.[field]));
  await fs.rm(getCustomerUploadDir(String(client._id)), { recursive: true, force: true });
  await Trade.deleteMany({ brokerId: client.brokerId, clientId: client._id });
  await Client.deleteOne({ _id: client._id, brokerId: client.brokerId, isDeleted: true, purgeStartedAt: { $ne: null } });
  return true;
}

async function purgeDeletedClients(now = new Date()) {
  const clients = await Client.find({
    isDeleted: true,
    $or: [{ deletedAt: { $lte: new Date(now.getTime() - RETENTION_MS) } }, { purgeStartedAt: { $ne: null } }],
  }).select("_id brokerId").limit(100);
  for (const client of clients) {
    try {
      await permanentlyDeleteClient(client.brokerId, client._id, new Date(now.getTime() - RETENTION_MS));
    } catch (error) {
      console.error(`Client purge failed for ${client._id}:`, error.message);
    }
  }
}

function startClientPurge() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await purgeDeletedClients(); }
    catch (error) { console.error("Client purge failed:", error.message); }
    finally { running = false; }
  };
  void run();
  const timer = setInterval(run, PURGE_INTERVAL_MS);
  timer.unref();
  const stop = () => clearInterval(timer);
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  return stop;
}

module.exports = { RETENTION_MS, KYC_ASSET_FIELDS, expiresAt, permanentlyDeleteClient, purgeDeletedClients, startClientPurge };
