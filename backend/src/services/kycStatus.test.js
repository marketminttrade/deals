const test = require("node:test");
const assert = require("node:assert/strict");
const { updateKycStatus } = require("./kycStatus");

test("basic registration stays incomplete without invented submission/verification events", () => {
  const client = { fullName: "Test Client", idCode: "ABC01", kyc: { history: [] } };
  assert.equal(updateKycStatus(client), "incomplete");
  assert.deepEqual(client.kyc.history, []);
  assert.equal(client.kyc.submittedAt, undefined);
  assert.equal(client.kyc.verifiedAt, undefined);
});

test("completion waits for all documents, records readiness once, and is not verification", () => {
  const client = { idCode: "ABC01", phone: "1234567890", address: "Test", kyc: {
    firstName: "Test", lastName: "Client", fatherName: "Parent", gender: "other", dateOfBirth: new Date("2000-01-01"),
    applicationDate: new Date(), initialDeposit: 0, aadhaarNumber: "123", panNumber: "TEST", history: [],
    panImageUrl: "pan", aadhaarFrontUrl: "front", aadhaarBackUrl: "back", customerPhotoUrl: "photo",
  } };
  assert.equal(updateKycStatus(client), "incomplete");
  client.kyc.customerSignatureUrl = "signature";
  assert.equal(updateKycStatus(client), "ready");
  assert.equal(client.kyc.history.length, 1);
  assert.equal(client.kyc.verifiedAt, undefined);
  assert.equal(updateKycStatus(client, "ready"), "ready");
  assert.equal(client.kyc.history.length, 1);
});
