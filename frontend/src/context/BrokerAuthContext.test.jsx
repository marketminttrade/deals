import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { BrokerAuthProvider, useBrokerAuth } from "./BrokerAuthContext";
import { brokerApi } from "../api/client";
jest.mock("../api/client", () => ({ BROKER_AUTH_STORAGE_KEY: "token", LEGACY_BROKER_AUTH_STORAGE_KEY: "old-token", brokerApi: { get: jest.fn() }, publicApi: {} }));
function Selection() {
  const { selectedClient, loading } = useBrokerAuth();
  return <div>{loading ? "Loading" : selectedClient?.fullName || "No account"}</div>;
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "test");
  localStorage.setItem("dealsrewards:selected-client", JSON.stringify({ _id: "deleted", fullName: "Old" }));
});
test("hydration replaces a deleted stored selection with an active account", async () => {
  brokerApi.get.mockImplementation(async (url) => ({ data: url.endsWith("/me") ? { broker: { _id: "broker" } } : [{ _id: "active", fullName: "Active" }] }));
  render(<BrokerAuthProvider><Selection /></BrokerAuthProvider>);
  expect(await screen.findByText("Active")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("dealsrewards:selected-client"))._id).toBe("active");
});
test("hydration clears selection when there are no active accounts", async () => {
  brokerApi.get.mockImplementation(async (url) => ({ data: url.endsWith("/me") ? { broker: { _id: "broker" } } : [] }));
  render(<BrokerAuthProvider><Selection /></BrokerAuthProvider>);
  await waitFor(() => expect(screen.getByText("No account")).toBeInTheDocument());
  expect(localStorage.getItem("dealsrewards:selected-client")).toBeNull();
});
