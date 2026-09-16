import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NewClientAddWizard from "./NewClientAddWizard";
import { brokerApi } from "../../api/client";

jest.mock("../../api/client", () => ({ brokerApi: { post: jest.fn(), patch: jest.fn() } }));

const client = {
  _id: "client-1", fullName: "Test Client", clientCode: "ABC01", phone: "9999999999", email: "", address: "Test address",
  kyc: { firstName: "Test", lastName: "Client", fatherName: "Parent", dateOfBirth: "2000-01-01T00:00:00Z", gender: "other",
    panNumber: "ABCDE1234F", aadhaarNumber: "123456789012", occupation: "Business", annualIncome: "100000", state: "Kerala", city: "Kochi", pincode: "682001",
    initialDeposit: 0, panImageUrl: "pan", aadhaarFrontUrl: "front", aadhaarBackUrl: "back", customerPhotoUrl: "photo", customerSignatureUrl: "signature" },
};

beforeEach(() => jest.clearAllMocks());
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next →" }));

test("existing client accepts manual code/location and reuses saved documents via PATCH", async () => {
  brokerApi.patch.mockResolvedValue({ data: client });
  const onComplete = jest.fn();
  render(<NewClientAddWizard customer={client} onComplete={onComplete} onCancel={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Client Code"), { target: { value: "custom01" } });
  fireEvent.change(screen.getByPlaceholderText("Enter state"), { target: { value: "Tamil Nadu" } });
  fireEvent.change(screen.getByPlaceholderText("Enter city"), { target: { value: "Chennai" } });
  next(); next(); next();
  fireEvent.click(screen.getByRole("button", { name: "Save KYC" }));
  await waitFor(() => expect(onComplete).toHaveBeenCalledWith(client));
  expect(brokerApi.post).not.toHaveBeenCalled();
  expect(brokerApi.patch).toHaveBeenCalledWith("/api/broker-portal/clients/client-1", expect.objectContaining({ clientCode: "CUSTOM01", idCode: "CUSTOM01", kyc: expect.objectContaining({ state: "Tamil Nadu", city: "Chennai" }) }));
});

test("upload failure retries the same newly saved client and skips completed uploads", async () => {
  // A prefilled registration without an ID exercises the POST -> retained ID -> PATCH retry lifecycle.
  const registration = { ...client, _id: undefined, kyc: { ...client.kyc, panImageUrl: "", aadhaarFrontUrl: "", aadhaarBackUrl: "", customerPhotoUrl: "", customerSignatureUrl: "" } };
  const onComplete = jest.fn();
  let failed = false;
  brokerApi.post.mockImplementation(async (url) => {
    if (url.endsWith("/clients")) return { data: { ...registration, _id: "client-1" } };
    if (url.endsWith("/aadhaarFront") && !failed) { failed = true; throw new Error("Upload unavailable"); }
    return { data: client };
  });
  brokerApi.patch.mockResolvedValue({ data: client });
  render(<NewClientAddWizard customer={registration} onComplete={onComplete} onCancel={jest.fn()} />);
  next(); next();
  for (const name of ["Upload customer photo", "Upload customer signature", "Upload PAN", "Upload Aadhaar front", "Upload Aadhaar back"]) {
    fireEvent.change(screen.getByLabelText(name), { target: { files: [new File(["image"], "test.png", { type: "image/png" })] } });
  }
  next();
  fireEvent.click(screen.getByRole("button", { name: "+ Add Client" }));
  await screen.findByText(/You can retry/);
  fireEvent.click(screen.getByRole("button", { name: "Save KYC" }));
  await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  expect(brokerApi.post.mock.calls.filter(([url]) => url.endsWith("/clients"))).toHaveLength(1);
  expect(brokerApi.post.mock.calls.filter(([url]) => url.endsWith("/panImage"))).toHaveLength(1);
  expect(brokerApi.patch).toHaveBeenCalledWith("/api/broker-portal/clients/client-1", expect.any(Object));
});

test("manual state/city and client code reject whitespace", () => {
  render(<NewClientAddWizard customer={client} onComplete={jest.fn()} onCancel={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText("Enter state"), { target: { value: "   " } });
  next();
  expect(screen.getByText("State is required.")).toBeTruthy();
  expect(brokerApi.patch).not.toHaveBeenCalled();
});
