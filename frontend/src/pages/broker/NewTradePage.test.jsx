import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import NewTradePage from "./NewTradePage";
import { brokerApi } from "../../api/client";
const mockClient = { _id: "client", fullName: "Customer", clientCode: "C01" };
const mockSelect = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn(), useParams: () => ({}) }), { virtual: true });
jest.mock("../../context/BrokerAuthContext", () => ({ useBrokerAuth: () => ({ selectedClient: mockClient, setSelectedClient: mockSelect }) }));
jest.mock("../../api/client", () => ({ brokerApi: { get: jest.fn(), post: jest.fn() } }));
beforeEach(() => { jest.clearAllMocks(); brokerApi.get.mockResolvedValue({ data: [mockClient] }); });

test("quantity begins at zero, can be cleared, and increments to one", async () => {
  render(<NewTradePage />);
  const quantity = await screen.findByRole("spinbutton", { name: "Quantity" });
  expect(quantity).toHaveValue(0);
  fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
  expect(quantity).toHaveValue(1);
  fireEvent.change(quantity, { target: { value: "" } });
  expect(quantity).toHaveValue(null);
  fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
  expect(quantity).toHaveValue(1);
  fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
  fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
  expect(quantity).toHaveValue(0);
});

test.each(["0", "1.5", "-1", ""])("invalid quantity %s never submits", async (value) => {
  render(<NewTradePage />);
  const quantity = await screen.findByRole("spinbutton", { name: "Quantity" });
  fireEvent.change(quantity, { target: { value } });
  fireEvent.submit(quantity.closest("form"));
  expect(await screen.findByText("Please enter a positive whole-number quantity.")).toBeInTheDocument();
  expect(brokerApi.post).not.toHaveBeenCalled();
});
