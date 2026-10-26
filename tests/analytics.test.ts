import { describe, expect, it } from "vitest";
import { applyFilters, median, metrics } from "../src/lib/analytics";
import { blankFilters, SCHEMA_FIELDS, TvetRecord } from "../src/lib/schema";

function record(overrides: Partial<TvetRecord> = {}): TvetRecord {
  return { ...Object.fromEntries(SCHEMA_FIELDS.map((field) => [field, ""])), respondent_id: crypto.randomUUID(), consent: "Ya, saya bersetuju", eligible: "Ya", employment_status: "Bekerja sepenuh masa", job_match: "Sepadan", monthly_income_rm: "2000", graduation_year: "2024", state: "Kedah", ...overrides } as TvetRecord;
}

describe("formula KPI", () => {
  const rows = [
    record({ monthly_income_rm: "1000" }),
    record({ employment_status: "Bekerja sendiri", job_match: "Tidak sepadan", monthly_income_rm: "3000" }),
    record({ employment_status: "Tidak bekerja, sedang mencari pekerjaan", job_match: "", monthly_income_rm: "" }),
    record({ employment_status: "Tidak bekerja, tidak sedang mencari pekerjaan", job_match: "", monthly_income_rm: "" }),
  ];
  it("mengira proporsi bekerja berasaskan semua responden sah", () => expect(metrics(rows).employed).toMatchObject({ numerator: 2, denominator: 4, value: .5 }));
  it("mengira kadar tenaga buruh dengan pencari aktif sahaja", () => expect(metrics(rows).labour).toMatchObject({ numerator: 2, denominator: 3, value: 2 / 3 }));
  it("menggunakan respons padanan sah sebagai penyebut", () => expect(metrics(rows).match).toMatchObject({ numerator: 1, denominator: 2, value: .5 }));
  it("mengira median gaji positif responden bekerja", () => expect(metrics(rows).salary).toMatchObject({ value: 2000, denominator: 2 }));
  it("mengira median genap dan tiada data", () => { expect(median([4, 2])).toBe(3); expect(median([])).toBeNull(); });
});

describe("penapis global", () => {
  it("menggunakan semua dimensi secara serentak", () => {
    const filters = { ...blankFilters(), graduation_year: "2024", state: "Kedah" };
    const rows = [record(), record({ state: "Perak" }), record({ graduation_year: "2023" })];
    expect(applyFilters(rows, filters)).toHaveLength(1);
  });
});
