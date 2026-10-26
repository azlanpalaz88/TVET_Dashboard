import { describe, expect, it } from "vitest";
import { createMapping, extractVariableId, normalizeRows, parseCsvText, validateRecords } from "../src/lib/importer";
import { SCHEMA_FIELDS, TvetRecord } from "../src/lib/schema";

const complete = (overrides: Partial<TvetRecord> = {}) => ({
  ...Object.fromEntries(SCHEMA_FIELDS.map((field) => [field, ""])),
  respondent_id: "TVETW-TEST-1", consent: "Ya, saya bersetuju", eligible: "Ya",
  age_group: "21–24 tahun", state: "Kedah", institution_type: "Politeknik",
  qualification: "Diploma TVET", programme: "Automotif", graduation_year: "2024",
  internship: "Tidak", internship_duration: "Tiada", career_guidance: "Ya",
  employment_status: "Bekerja sepenuh masa", employment_sector: "Swasta",
  employment_type: "Tetap", job_match: "Sepadan", monthly_income_rm: "2500",
  first_job_delay: "1–3 bulan", main_barrier: "Stereotaip gender",
  ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`S${String(i + 1).padStart(2, "0")}`, "4"])),
  B01: "Tidak berkenaan", B02: "3", B03: "2", ...overrides,
} as TvetRecord);

describe("pemetaan CSV", () => {
  it("mengekstrak ID tajuk Google Forms dan tajuk normal", () => {
    expect(extractVariableId("[employment_status] Status utama anda")).toBe("employment_status");
    expect(extractVariableId("programme")).toBe("programme");
    expect(createMapping(["Timestamp", "[consent] Soalan", "state"])).toEqual({ consent: "[consent] Soalan", state: "state" });
  });
  it("memelihara koma dalam nilai berpetik dan menjana ID anonim", () => {
    const parsed = parseCsvText('[consent] Soalan,[eligible] Soalan,[employment_status] Soalan\n"Ya, saya bersetuju",Ya,"Tidak bekerja, sedang mencari pekerjaan"');
    const rows = normalizeRows(parsed.rows, createMapping(parsed.headers));
    expect(rows[0].employment_status).toBe("Tidak bekerja, sedang mencari pekerjaan");
    expect(rows[0].respondent_id).toMatch(/^TVETW-IMP-/);
  });
});

describe("missing values dan validasi", () => {
  it("menerima gaji pilihan kosong dan Tidak berkenaan sebagai bukan sifar", () => {
    const result = validateRecords([complete({ monthly_income_rm: "", B01: "Tidak berkenaan" })]);
    expect(result.valid).toHaveLength(1); expect(result.issues).toHaveLength(0);
  });
  it("mengesan Likert, gaji dan cabang tidak sah", () => {
    const result = validateRecords([complete({ S03: "6", monthly_income_rm: "-1", job_search_duration: "1–3 bulan" })]);
    expect(result.issues.map((i) => i.field)).toEqual(expect.arrayContaining(["S03", "monthly_income_rm", "employment_status"]));
    expect(result.valid).toHaveLength(0);
  });
  it("mengesan ID berulang", () => expect(validateRecords([complete(), complete()]).duplicates).toBe(1));
});
