import { FilterField, Filters, QUESTION_LABELS, SKILL_DOMAINS, TvetRecord, filterFields, isEmployed } from "./schema";

export type CountDatum = { name: string; value: number; percent: number };

export function applyFilters(records: TvetRecord[], filters: Filters): TvetRecord[] {
  return records.filter((record) => filterFields.every((field) => filters[field] === "Semua" || record[field] === filters[field]));
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

export function metrics(records: TvetRecord[]) {
  const eligible = records.filter((r) => r.consent === "Ya, saya bersetuju" && r.eligible === "Ya");
  const employed = eligible.filter(isEmployed);
  const seeking = eligible.filter((r) => r.employment_status === "Tidak bekerja, sedang mencari pekerjaan");
  const matches = employed.filter((r) => r.job_match).length;
  const exactMatches = employed.filter((r) => r.job_match === "Sepadan").length;
  const salaries = employed.map((r) => Number(r.monthly_income_rm)).filter((v) => Number.isFinite(v) && v > 0);
  return {
    respondents: eligible.length,
    employed: { numerator: employed.length, denominator: eligible.length, value: eligible.length ? employed.length / eligible.length : 0 },
    labour: { numerator: employed.length, denominator: employed.length + seeking.length, value: employed.length + seeking.length ? employed.length / (employed.length + seeking.length) : 0 },
    match: { numerator: exactMatches, denominator: matches, value: matches ? exactMatches / matches : 0 },
    salary: { value: median(salaries), denominator: salaries.length, missing: employed.length - salaries.length },
  };
}

export function distribution(records: TvetRecord[], field: keyof TvetRecord, includeMissing = false): CountDatum[] {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = record[field] || (includeMissing ? "Tiada data" : "");
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const denominator = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts.entries()].map(([name, value]) => ({ name, value, percent: denominator ? value / denominator : 0 })).sort((a, b) => b.value - a.value);
}

export function mean(values: number[]): number | null {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

export function skillDomainMeans(records: TvetRecord[]) {
  return SKILL_DOMAINS.map((domain) => {
    const respondentMeans = records.map((record) => mean(domain.fields.map((field) => Number(record[field])).filter((value) => value >= 1 && value <= 5))).filter((value): value is number => value !== null);
    return { name: domain.name, value: mean(respondentMeans) ?? 0, n: respondentMeans.length };
  });
}

export function itemMeans(records: TvetRecord[], prefix: "S" | "B") {
  const fields = prefix === "S" ? Array.from({ length: 15 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`) : ["B01", "B02", "B03"];
  return fields.map((field) => {
    const values = records.map((record) => Number(record[field as keyof TvetRecord])).filter((value) => value >= 1 && value <= 5);
    return { field, name: QUESTION_LABELS[field as keyof TvetRecord] ?? field, value: mean(values) ?? 0, n: values.length, na: records.length - values.length };
  });
}

export function programmeComparison(records: TvetRecord[]) {
  return distribution(records, "programme").map((item) => {
    const rows = records.filter((record) => record.programme === item.name);
    const stat = metrics(rows);
    return { name: item.name, bekerja: Math.round(stat.employed.value * 1000) / 10, tidakBekerja: Math.round((1 - stat.employed.value) * 1000) / 10, n: rows.length };
  });
}

export function cohortTrend(records: TvetRecord[]) {
  return [...new Set(records.map((record) => record.graduation_year))].filter(Boolean).sort().map((year) => {
    const rows = records.filter((record) => record.graduation_year === year);
    return { name: year, kadar: Math.round(metrics(rows).employed.value * 1000) / 10, n: rows.length };
  });
}

export function crossTab(records: TvetRecord[], rowField: FilterField, colField: FilterField) {
  const rows = [...new Set(records.map((r) => r[rowField]))].filter(Boolean);
  const cols = [...new Set(records.map((r) => r[colField]))].filter(Boolean);
  return { rows, cols, values: rows.map((row) => cols.map((col) => records.filter((r) => r[rowField] === row && r[colField] === col).length)) };
}

export function automatedInsights(records: TvetRecord[]): string[] {
  if (!records.length) return ["Tiada rekod memenuhi kombinasi penapis semasa."];
  const kpi = metrics(records);
  const strongest = skillDomainMeans(records).sort((a, b) => b.value - a.value)[0];
  const barrier = distribution(records, "main_barrier")[0];
  const status = distribution(records, "employment_status")[0];
  return [
    `${(kpi.employed.value * 100).toFixed(1)}% responden sah bekerja (${kpi.employed.numerator}/${kpi.employed.denominator}); ini ialah status pekerjaan, bukan ukuran keseluruhan konstruk kebolehpasaran.`,
    status ? `Kategori status paling lazim ialah ${status.name.toLowerCase()} dengan ${status.value} responden.` : "",
    strongest ? `Purata tertinggi bagi pengelompokan cadangan S01–S15 ialah ${strongest.name.toLowerCase()} (${strongest.value.toFixed(2)}/5).` : "",
    barrier ? `Halangan utama paling kerap dilaporkan ialah ${barrier.name.toLowerCase()} (${barrier.value} responden).` : "",
  ].filter(Boolean);
}
