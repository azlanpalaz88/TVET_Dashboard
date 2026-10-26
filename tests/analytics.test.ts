import { describe, expect, it } from "vitest";
import { adjustHolm, applyFilters, chiSquareEmployment, employmentOddsRatio, median, metrics } from "../src/lib/analytics";
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

describe("analisis inferensi", () => {
  it("mengira khi kuasa dua dan Cramér's V bagi jadual 2x2", () => {
    const rows = [
      record({ programme: "Program A", employment_status: "Bekerja sepenuh masa" }),
      record({ programme: "Program A", employment_status: "Bekerja sendiri" }),
      record({ programme: "Program B", employment_status: "Tidak bekerja, sedang mencari pekerjaan" }),
      record({ programme: "Program B", employment_status: "Tidak bekerja, tidak sedang mencari pekerjaan" }),
    ];
    const result = chiSquareEmployment(rows, "programme", "Program");
    expect(result.chiSquare).toBeCloseTo(4);
    expect(result.degreesOfFreedom).toBe(1);
    expect(result.pValue).toBeCloseTo(0.0455, 3);
    expect(result.cramerV).toBeCloseTo(1);
  });

  it("melaraskan nilai-p menggunakan kaedah Holm", () => {
    const adjusted = adjustHolm([{ pValue: .01 }, { pValue: .04 }, { pValue: .03 }]);
    expect(adjusted.map((item) => item.adjustedPValue)).toEqual([.03, .06, .06]);
  });

  it("mengira odds ratio dan selang keyakinan", () => {
    const rows = [
      ...Array.from({ length: 8 }, () => record({ internship: "Ya", employment_status: "Bekerja sepenuh masa" })),
      ...Array.from({ length: 2 }, () => record({ internship: "Ya", employment_status: "Tidak bekerja, sedang mencari pekerjaan" })),
      ...Array.from({ length: 4 }, () => record({ internship: "Tidak", employment_status: "Bekerja sepenuh masa" })),
      ...Array.from({ length: 6 }, () => record({ internship: "Tidak", employment_status: "Tidak bekerja, sedang mencari pekerjaan" })),
    ];
    const result = employmentOddsRatio(rows, "Latihan", "Ya vs Tidak", (row) => row.internship === "Ya", (row) => row.internship === "Tidak");
    expect(result.oddsRatio).toBeCloseTo(6);
    expect(result.lower).toBeLessThan(result.oddsRatio);
    expect(result.upper).toBeGreaterThan(result.oddsRatio);
  });
});
