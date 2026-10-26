import Papa from "papaparse";
import * as XLSX from "xlsx";
import { CATEGORY_OPTIONS, EMPLOYED_STATUSES, FieldId, SCHEMA_FIELDS, TvetRecord, recordSchema } from "./schema";

export type Mapping = Partial<Record<FieldId, string>>;
export type ValidationIssue = { row: number; field: string; severity: "ralat" | "amaran"; message: string };
export type ValidationResult = { valid: TvetRecord[]; issues: ValidationIssue[]; duplicates: number };

export function extractVariableId(header: string): string {
  const clean = header.trim();
  const bracketed = clean.match(/^\[([A-Za-z][A-Za-z0-9_]*)\]/)?.[1];
  return bracketed ?? clean;
}

export function createMapping(headers: string[]): Mapping {
  const mapping: Mapping = {};
  for (const header of headers) {
    const id = extractVariableId(header);
    if (SCHEMA_FIELDS.includes(id as FieldId)) mapping[id as FieldId] = header;
  }
  return mapping;
}

export function normalizeRows(rows: Record<string, unknown>[], mapping: Mapping): TvetRecord[] {
  return rows.map((raw, index) => {
    const normalized = Object.fromEntries(SCHEMA_FIELDS.map((field) => [field, String(raw[mapping[field] ?? ""] ?? "").trim()])) as TvetRecord;
    if (!normalized.respondent_id) normalized.respondent_id = `TVETW-IMP-${String(index + 1).padStart(5, "0")}`;
    return normalized;
  });
}

export function parseCsvText(text: string): { rows: Record<string, unknown>[]; headers: string[] } {
  const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim() });
  if (parsed.errors.length && !parsed.data.length) throw new Error(`CSV tidak dapat dibaca: ${parsed.errors[0].message}`);
  return { rows: parsed.data, headers: parsed.meta.fields ?? [] };
}

export async function parseUpload(file: File): Promise<{ records: TvetRecord[]; headers: string[]; mapping: Mapping }> {
  if (file.size > 10 * 1024 * 1024) throw new Error("Fail melebihi had 10 MB untuk prototaip ini.");
  let rows: Record<string, unknown>[];
  let headers: string[];
  if (/\.xlsx?$/i.test(file.name)) {
    const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = book.Sheets[book.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    headers = rows.length ? Object.keys(rows[0]) : [];
  } else {
    ({ rows, headers } = parseCsvText(await file.text()));
  }
  const mapping = createMapping(headers);
  return { records: normalizeRows(rows, mapping), headers, mapping };
}

export function validateRecords(records: TvetRecord[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  const valid: TvetRecord[] = [];
  records.forEach((record, index) => {
    const row = index + 2;
    if (!recordSchema.safeParse(record).success) issues.push({ row, field: "rekod", severity: "ralat", message: "Struktur rekod tidak lengkap." });
    if (seen.has(record.respondent_id)) {
      duplicates++;
      issues.push({ row, field: "respondent_id", severity: "ralat", message: "ID responden berulang." });
    }
    seen.add(record.respondent_id);
    for (const [field, options] of Object.entries(CATEGORY_OPTIONS)) {
      const value = record[field as FieldId];
      if (value && !options?.includes(value)) issues.push({ row, field, severity: "ralat", message: `Kategori tidak sah: ${value}` });
    }
    for (let i = 1; i <= 15; i++) {
      const field = `S${String(i).padStart(2, "0")}` as FieldId;
      if (record[field] && !["1", "2", "3", "4", "5"].includes(record[field])) issues.push({ row, field, severity: "ralat", message: "Skor Likert mestilah 1 hingga 5." });
    }
    for (const field of ["B01", "B02", "B03"] as FieldId[]) {
      if (record[field] && !["1", "2", "3", "4", "5", "Tidak berkenaan"].includes(record[field])) issues.push({ row, field, severity: "ralat", message: "Nilai halangan tidak sah." });
    }
    const employed = EMPLOYED_STATUSES.includes(record.employment_status as (typeof EMPLOYED_STATUSES)[number]);
    const salary = Number(record.monthly_income_rm);
    if (record.monthly_income_rm && (!Number.isFinite(salary) || salary <= 0)) issues.push({ row, field: "monthly_income_rm", severity: "ralat", message: "Pendapatan mesti nombor positif." });
    if (employed && (!record.employment_sector || !record.employment_type || !record.job_match || !record.first_job_delay)) issues.push({ row, field: "employment_status", severity: "amaran", message: "Maklumat pekerjaan wajib tidak lengkap bagi responden bekerja." });
    if (!employed && [record.employment_sector, record.employment_type, record.job_match, record.first_job_delay].some(Boolean)) issues.push({ row, field: "employment_status", severity: "amaran", message: "Medan pekerjaan diisi bagi responden tidak bekerja." });
    if (employed && [record.job_search_duration, record.nonemployment_reason].some(Boolean)) issues.push({ row, field: "employment_status", severity: "amaran", message: "Medan belum bekerja diisi bagi responden bekerja." });
    if (record.internship === "Tidak" && record.internship_duration !== "Tiada") issues.push({ row, field: "internship_duration", severity: "amaran", message: "Tempoh latihan tidak konsisten dengan jawapan latihan industri." });
    if (record.consent === "Ya, saya bersetuju" && record.eligible === "Ya" && !issues.some((issue) => issue.row === row && issue.severity === "ralat")) valid.push(record);
  });
  return { valid, issues, duplicates };
}
