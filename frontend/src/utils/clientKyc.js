export const kycStatusLabel = (status) => ({ incomplete: "Incomplete", ready: "Ready", generated: "Form generated", verified: "Verified" }[status] || "Incomplete");

export const kycFileFields = {
  panFile: "panImageUrl", aadhaarFrontFile: "aadhaarFrontUrl", aadhaarBackFile: "aadhaarBackUrl",
  customerPhotoFile: "customerPhotoUrl", customerSignatureFile: "customerSignatureUrl", addressProofFile: "addressProofUrl",
};

export function buildExistingKycForm(customer) {
  if (!customer) return {};
  const kyc = customer.kyc || {};
  const [firstName = "", ...lastName] = String(customer.fullName || "").trim().split(/\s+/);
  const gender = kyc.gender || "";
  return {
    ...Object.fromEntries(Object.entries(kyc).filter(([, value]) => value !== null && value !== undefined)),
    firstName: kyc.firstName || firstName,
    lastName: kyc.lastName || lastName.join(" "),
    fullName: customer.fullName || "",
    clientCode: customer.clientCode || customer.idCode || "",
    phone: customer.phone || "", email: customer.email || "", address: customer.address || "", notes: customer.notes || "",
    dob: kyc.dateOfBirth ? kyc.dateOfBirth.slice(0, 10) : "",
    gender: gender ? gender[0].toUpperCase() + gender.slice(1) : "",
    initialDeposit: String(kyc.initialDeposit ?? 0),
    ...Object.fromEntries(Object.entries(kycFileFields).map(([field, urlField]) => [field,
      kyc[urlField] ? { url: kyc[urlField], name: "Saved document", size: 0 } : null,
    ])),
  };
}
