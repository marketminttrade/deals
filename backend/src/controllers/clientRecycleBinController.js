const Client = require("../models/Client");
const { expiresAt, permanentlyDeleteClient } = require("../services/clientDeletion");

const owned = (req) => ({ _id: req.params.clientId, brokerId: req.broker._id });
const notFound = (res) => res.status(404).json({ message: "Client not found or action unavailable." });

async function listDeletedClients(req, res) {
  const clients = await Client.find({ brokerId: req.broker._id, isDeleted: true }).select("fullName clientCode idCode deletedAt purgeStartedAt").sort({ deletedAt: -1 }).lean();
  return res.json(clients.map((client) => ({ ...client, expiresAt: expiresAt(client.deletedAt) })));
}

async function softDeleteClient(req, res) {
  const client = await Client.findOneAndUpdate(
    { ...owned(req), isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: new Date(), purgeStartedAt: null } }, { new: true }
  );
  if (!client) return notFound(res);
  return res.json({ message: "Client moved to Recycle Bin.", expiresAt: expiresAt(client.deletedAt) });
}

async function restoreClient(req, res) {
  const client = await Client.findOneAndUpdate(
    { ...owned(req), isDeleted: true, purgeStartedAt: null },
    { $set: { isDeleted: false, deletedAt: null } }, { new: true }
  );
  if (!client) return notFound(res);
  return res.json(client);
}

async function permanentDeleteClient(req, res) {
  if (!await permanentlyDeleteClient(req.broker._id, req.params.clientId)) return notFound(res);
  return res.json({ message: "Client and related data permanently deleted." });
}

module.exports = { listDeletedClients, softDeleteClient, restoreClient, permanentDeleteClient };
