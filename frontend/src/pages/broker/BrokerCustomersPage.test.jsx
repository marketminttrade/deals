import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import BrokerCustomersPage from "./BrokerCustomersPage";
import { brokerApi } from "../../api/client";

const mockClient = { _id: "client-1", fullName: "Test Client", clientCode: "ABC01", phone: "", email: "", address: "", kyc: { status: "incomplete" } };
const mockSelect = jest.fn();
const mockNavigate = jest.fn();
const mockLocation = { pathname: "/account/customers", state: null };
// CRA's Jest 27 resolver cannot resolve React Router 7's export-only entry point.
jest.mock("react-router-dom", () => ({ useLocation: () => mockLocation, useNavigate: () => mockNavigate }), { virtual: true });
jest.mock("../../context/BrokerAuthContext", () => ({ useBrokerAuth: () => ({ selectedClient: mockClient, setSelectedClient: mockSelect }) }));
jest.mock("../../api/client", () => ({ brokerApi: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock("../../utils/kycPdf", () => ({ downloadCustomerKycPdf: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  brokerApi.get.mockImplementation(async (url) => ({ data: url.endsWith("kyc-preview") ? { client: mockClient } : [mockClient] }));
});

test("Add opens basic registration and creates without documents", async () => {
  brokerApi.post.mockResolvedValue({ data: { ...mockClient, _id: "new-client" } });
  render(<BrokerCustomersPage />);
  await screen.findByRole("button", { name: "Edit Client" });
  fireEvent.click(screen.getByRole("button", { name: "Add", exact: true }));
  const drawer = within(screen.getByRole("dialog", { name: "Add New Client" }));
  fireEvent.change(drawer.getByLabelText("Full Name"), { target: { value: "New Client" } });
  fireEvent.change(drawer.getByLabelText("Client Code"), { target: { value: "new01" } });
  fireEvent.click(drawer.getByRole("button", { name: "Create Client" }));
  await waitFor(() => expect(brokerApi.post).toHaveBeenCalledWith("/api/broker-portal/clients", { fullName: "New Client", clientCode: "NEW01", idCode: "NEW01", phone: "", email: "", address: "" }));
});

test("Edit Client prefills basic details and patches the selected ID", async () => {
  brokerApi.patch.mockResolvedValue({ data: mockClient });
  render(<BrokerCustomersPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Edit Client" }));
  const drawer = within(screen.getByRole("dialog", { name: "Edit Client" }));
  expect(drawer.getByLabelText("Client Code").value).toBe("ABC01");
  fireEvent.change(drawer.getByLabelText("Client Code"), { target: { value: "updated01" } });
  fireEvent.click(drawer.getByRole("button", { name: "Update Client" }));
  await waitFor(() => expect(brokerApi.patch).toHaveBeenCalledWith("/api/broker-portal/clients/client-1", expect.objectContaining({ clientCode: "UPDATED01", idCode: "UPDATED01" })));
  expect(brokerApi.post).not.toHaveBeenCalled();
});
