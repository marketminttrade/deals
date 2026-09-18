const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const Client = require("../models/Client");
const Trade = require("../models/Trade");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
const destroyed = [];
mock.method(cloudinary, "destroyImages", async (ids) => { destroyed.push(ids); });
const { RETENTION_MS, KYC_ASSET_FIELDS, expiresAt, permanentlyDeleteClient, purgeDeletedClients } = require("./clientDeletion");

test("retention is exactly 72 hours, including month boundaries", () => {
  assert.equal(RETENTION_MS, 259200000);
  assert.equal(expiresAt("2026-01-30T12:00:00Z").toISOString(), "2026-02-02T12:00:00.000Z");
});

test("permanent deletion scopes ownership, cleans all assets and trades before client removal", async (t) => {
  const order = [];
  const client = { _id: "client", brokerId: "broker", kyc: Object.fromEntries(KYC_ASSET_FIELDS.map((field) => [field, field])) };
  t.mock.method(Client, "findOneAndUpdate", async (filter, update) => {
    assert.deepEqual(filter, { _id: "client", brokerId: "broker", isDeleted: true });
    assert.ok(update.$set.purgeStartedAt instanceof Date);
    return client;
  });
  t.mock.method(fs, "rm", async () => order.push("files"));
  t.mock.method(Trade, "deleteMany", async (filter) => {
    assert.deepEqual(filter, { brokerId: "broker", clientId: "client" });
    order.push("trades");
  });
  t.mock.method(Client, "deleteOne", async () => order.push("client"));
  assert.equal(await permanentlyDeleteClient("broker", "client"), true);
  assert.deepEqual(order, ["files", "trades", "client"]);
  assert.deepEqual(destroyed.at(-1), KYC_ASSET_FIELDS);
  assert.equal(KYC_ASSET_FIELDS.length, 7);
});

test("foreign, active or restored client cannot be permanently deleted", async (t) => {
  t.mock.method(Client, "findOneAndUpdate", async () => null);
  const remove = t.mock.method(Trade, "deleteMany", async () => {});
  assert.equal(await permanentlyDeleteClient("other", "client"), false);
  assert.equal(remove.mock.callCount(), 0);
});

test("cleanup failure preserves client and trades for retry", async (t) => {
  t.mock.method(Client, "findOneAndUpdate", async () => ({ _id: "client", brokerId: "broker" }));
  t.mock.method(fs, "rm", async () => { throw new Error("storage unavailable"); });
  const trades = t.mock.method(Trade, "deleteMany", async () => {});
  const client = t.mock.method(Client, "deleteOne", async () => {});
  await assert.rejects(permanentlyDeleteClient("broker", "client"), /storage unavailable/);
  assert.equal(trades.mock.callCount(), 0);
  assert.equal(client.mock.callCount(), 0);
});

test("scheduled purge includes the cutoff and resumes unfinished cleanup", async (t) => {
  const now = new Date("2026-09-19T10:00:00Z");
  t.mock.method(Client, "find", (query) => {
    assert.equal(query.isDeleted, true);
    assert.equal(query.$or[0].deletedAt.$lte.toISOString(), "2026-09-16T10:00:00.000Z");
    assert.deepEqual(query.$or[1], { purgeStartedAt: { $ne: null } });
    return { select: () => ({ limit: async () => [] }) };
  });
  await purgeDeletedClients(now);
});
