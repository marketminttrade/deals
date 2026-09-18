const { test } = require("node:test");
const assert = require("node:assert/strict");
const Client = require("../models/Client");
const { softDeleteClient, restoreClient } = require("./clientRecycleBinController");
const req = { broker: { _id: "owner" }, params: { clientId: "client" } };
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }

test("soft delete is owner scoped and cannot reset an existing retention period", async (t) => {
  t.mock.method(Client, "findOneAndUpdate", async (filter, update) => {
    assert.deepEqual(filter, { _id: "client", brokerId: "owner", isDeleted: { $ne: true } });
    assert.equal(update.$set.isDeleted, true);
    return { deletedAt: update.$set.deletedAt };
  });
  const res = response();
  await softDeleteClient(req, res);
  assert.equal(res.code, 200);
  assert.ok(res.body.expiresAt instanceof Date);
});

test("restore cannot race a started permanent deletion", async (t) => {
  t.mock.method(Client, "findOneAndUpdate", async (filter, update) => {
    assert.deepEqual(filter, { _id: "client", brokerId: "owner", isDeleted: true, purgeStartedAt: null });
    assert.deepEqual(update.$set, { isDeleted: false, deletedAt: null });
    return null;
  });
  const res = response();
  await restoreClient(req, res);
  assert.equal(res.code, 404);
});

test("recycle-bin route resolves before dynamic client ID validation", async (t) => {
  const express = require("express");
  t.mock.method(Client, "find", (query) => {
    assert.deepEqual(query, { brokerId: "owner", isDeleted: true });
    return { select: () => ({ sort: () => ({ lean: async () => [] }) }) };
  });
  const app = express();
  app.use((request, _res, next) => { request.broker = req.broker; next(); });
  app.use(require("../routes/brokerPortalClientRoutes"));
  const server = app.listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const bin = await fetch(`${base}/recycle-bin`);
  assert.equal(bin.status, 200);
  assert.deepEqual(await bin.json(), []);
  const invalid = await fetch(`${base}/bad-id`);
  assert.equal(invalid.status, 400);
});
