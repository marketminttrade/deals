import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ClientSwitcherModal } from "./BrokerDashboardPage";
import { brokerApi } from "../../api/client";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock("../../api/client", () => ({ brokerApi: { get: jest.fn(), delete: jest.fn(), patch: jest.fn() } }));
const client = { _id: "client", fullName: "Test Customer", clientCode: "C01", expiresAt: new Date(Date.now() + 86400000).toISOString() };
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, "confirm").mockReturnValue(true);
  brokerApi.get.mockResolvedValue({ data: [client] });
  brokerApi.delete.mockResolvedValue({ data: {} });
  brokerApi.patch.mockResolvedValue({ data: client });
});
afterEach(() => jest.restoreAllMocks());

test("deleting a client refreshes accounts without selecting or closing", async () => {
  const onSelect = jest.fn();
  const onClose = jest.fn();
  const onRefresh = jest.fn().mockResolvedValue();
  render(<ClientSwitcherModal clients={[client]} onSelect={onSelect} onClose={onClose} onRefresh={onRefresh} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete Test Customer" }));
  await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  expect(brokerApi.delete).toHaveBeenCalledWith("/api/broker-portal/clients/client/soft-delete");
  expect(onSelect).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

test("recycle bin supports restore and confirmed permanent deletion", async () => {
  render(<ClientSwitcherModal clients={[]} onSelect={jest.fn()} onClose={jest.fn()} onRefresh={jest.fn().mockResolvedValue()} />);
  fireEvent.click(screen.getByRole("button", { name: "Recycle Bin" }));
  fireEvent.click(await screen.findByRole("button", { name: "Restore" }));
  await waitFor(() => expect(brokerApi.patch).toHaveBeenCalledWith("/api/broker-portal/clients/client/restore"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Permanently Delete" })).not.toBeDisabled());
  fireEvent.click(screen.getByRole("button", { name: "Permanently Delete" }));
  await waitFor(() => expect(brokerApi.delete).toHaveBeenCalledWith("/api/broker-portal/clients/client/permanent-delete"));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("cannot be undone"));
});

test("cancelling deletion does not call the API", () => {
  window.confirm.mockReturnValue(false);
  render(<ClientSwitcherModal clients={[client]} onSelect={jest.fn()} onClose={jest.fn()} onRefresh={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete Test Customer" }));
  expect(brokerApi.delete).not.toHaveBeenCalled();
});
