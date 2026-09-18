import { maskEmail, maskPhoneNumber } from "./formatters";

test("PDF email masking preserves edges and TLD", () => {
  expect(maskEmail("john.doe@gmail.com")).toBe("jo***oe@gm***.com");
  expect(maskEmail("a@b.co")).toBe("a***@***.co");
  expect(maskEmail("abc@example.co.uk")).toBe("a***@ex***.c***.uk");
});

test("missing and malformed emails never leak raw content", () => {
  expect(maskEmail(null)).toBe("-");
  expect(maskEmail("raw-private-data")).toBe("***");
  expect(maskEmail("a@b@c.com")).toBe("***");
});

test("existing phone masking preserves formatting and only edge digits", () => {
  expect(maskPhoneNumber("+91 9876541234")).toBe("+91 9XXXXXX234");
  expect(maskPhoneNumber(null)).toBe("-");
});
