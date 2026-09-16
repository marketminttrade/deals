function isKycComplete(client) {
  const kyc = client.kyc || {};
  return Boolean(
    [kyc.firstName, kyc.lastName, kyc.fatherName, client.idCode, client.phone, client.address,
      kyc.gender, kyc.aadhaarNumber, kyc.panNumber, kyc.aadhaarFrontUrl, kyc.aadhaarBackUrl,
      kyc.panImageUrl, kyc.customerPhotoUrl, kyc.customerSignatureUrl]
      .every((value) => String(value || "").trim()) &&
    kyc.dateOfBirth && kyc.applicationDate && Number.isFinite(Number(kyc.initialDeposit)) && Number(kyc.initialDeposit) >= 0
  );
}

function updateKycStatus(client, previousStatus = "incomplete") {
  const kyc = client.kyc;
  const complete = isKycComplete(client);
  kyc.status = complete ? (["generated", "verified"].includes(previousStatus) ? previousStatus : "ready") : "incomplete";
  if (complete && previousStatus === "incomplete") {
    kyc.submittedAt = kyc.submittedAt || new Date();
    kyc.history = [...(kyc.history || []), {
      title: "KYC details completed", description: "Required details and documents are available.",
      timestamp: new Date(), iconType: "submit",
    }];
  }
  return kyc.status;
}

module.exports = { isKycComplete, updateKycStatus };
