const { test } = require("node:test");
const assert = require("node:assert/strict");
const Client = require("../models/Client");
const Trade = require("../models/Trade");
const { createBrokerTrade, listBrokerTrades, clearAllBrokerTrades } = require("./brokerPortalTradeController");
const { getInvoicePreview } = require("./brokerPortalInvoiceController");
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
const id = "507f1f77bcf86cd799439011";

test("trade creation and invoice generation reject deleted or foreign clients", async (t) => {
  t.mock.method(Client, "findOne", async (query) => {
    assert.equal(query.brokerId, "broker");
    assert.deepEqual(query.isDeleted, { $ne: true });
    return null;
  });
  const create = t.mock.method(Trade, "create", async () => {});
  const tradeRes = response();
  await createBrokerTrade({ broker: { _id: "broker" }, body: { clientId: id } }, tradeRes);
  assert.equal(tradeRes.code, 404);
  assert.equal(create.mock.callCount(), 0);
  const invoiceRes = response();
  await getInvoicePreview({ broker: { _id: "broker" }, query: { clientId: id, fromDate: "2026-01-01", toDate: "2026-01-02" } }, invoiceRes);
  assert.equal(invoiceRes.code, 404);
});

test("trade list and clear-all never include recycled client trades", async (t) => {
  t.mock.method(Client, "find", (query) => {
    assert.deepEqual(query, { brokerId: "broker", isDeleted: { $ne: true } });
    return { distinct: async () => [id] };
  });
  t.mock.method(Trade, "find", (query) => {
    assert.deepEqual(query.clientId, { $in: [] });
    return { populate: () => ({ sort: async () => [] }) };
  });
  await listBrokerTrades({ broker: { _id: "broker" }, query: { clientId: "deleted" } }, response());
  t.mock.method(Trade, "deleteMany", async (query) => {
    assert.deepEqual(query, { brokerId: "broker", clientId: { $in: [id] } });
    return { deletedCount: 0 };
  });
  await clearAllBrokerTrades({ broker: { _id: "broker" } }, response());
});
