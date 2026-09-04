import { normalizePhone } from "@/lib/utils/phone";

describe("normalizePhone", () => {
  const cases: Array<[string, string]> = [
    ["03181646200", "03181646200"],
    ["3XXXXXXXXX".replaceAll("X", "1"), "03111111111"],
    ["+923181646200", "03181646200"],
    ["923181646200", "03181646200"],
    ["03 18-1646 200", "03181646200"],
    ["+92 318 1646200", "03181646200"],
    ["(03)18-1646-200", "03181646200"],
    ["03002220001", "03002220001"],
    ["923002220001", "03002220001"],
  ];

  it.each(cases)("normalizes %p → %p", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("never produces two spellings for the same number", () => {
    const spellings = [
      "03181646200",
      "+923181646200",
      "923181646200",
      "3181646200",
      "03-181-646200",
      "+92(318)1646200",
    ];
    const normalized = new Set(spellings.map(normalizePhone));
    expect(normalized.size).toBe(1);
    expect([...normalized][0]).toBe("03181646200");
  });
});