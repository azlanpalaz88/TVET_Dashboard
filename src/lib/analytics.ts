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

function logGamma(value: number): number {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  const z = value - 1;
  let x = 0.9999999999998099;
  coefficients.forEach((coefficient, index) => { x += coefficient / (z + index + 1); });
  const t = z + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function regularizedGammaQ(shape: number, x: number): number {
  if (x < 0 || shape <= 0) return Number.NaN;
  if (x === 0) return 1;
  const epsilon = 1e-14;
  if (x < shape + 1) {
    let sum = 1 / shape;
    let term = sum;
    let current = shape;
    for (let index = 1; index <= 200; index++) {
      current += 1;
      term *= x / current;
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * epsilon) break;
    }
    const p = sum * Math.exp(-x + shape * Math.log(x) - logGamma(shape));
    return Math.max(0, Math.min(1, 1 - p));
  }
  let b = x + 1 - shape;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let index = 1; index <= 200; index++) {
    const an = -index * (index - shape);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return Math.max(0, Math.min(1, Math.exp(-x + shape * Math.log(x) - logGamma(shape)) * h));
}

export type AssociationResult = {
  field: keyof TvetRecord;
  label: string;
  n: number;
  categories: number;
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  adjustedPValue: number;
  cramerV: number;
  minimumExpected: number;
};

export function chiSquareEmployment(records: TvetRecord[], field: keyof TvetRecord, label: string): AssociationResult {
  const usable = records.filter((record) => record[field] && record.employment_status);
  const categories = [...new Set(usable.map((record) => record[field]))];
  const table = categories.map((category) => {
    const rows = usable.filter((record) => record[field] === category);
    const employed = rows.filter(isEmployed).length;
    return [employed, rows.length - employed];
  });
  const columnTotals = [0, 1].map((column) => table.reduce((total, row) => total + row[column], 0));
  const n = usable.length;
  let chiSquare = 0;
  let minimumExpected = Number.POSITIVE_INFINITY;
  table.forEach((row) => row.forEach((observed, column) => {
    const expected = n ? row.reduce((a, b) => a + b, 0) * columnTotals[column] / n : 0;
    minimumExpected = Math.min(minimumExpected, expected);
    if (expected > 0) chiSquare += (observed - expected) ** 2 / expected;
  }));
  const degreesOfFreedom = Math.max(0, categories.length - 1);
  const pValue = degreesOfFreedom ? regularizedGammaQ(degreesOfFreedom / 2, chiSquare / 2) : 1;
  return {
    field, label, n, categories: categories.length, chiSquare, degreesOfFreedom, pValue,
    adjustedPValue: pValue,
    cramerV: n ? Math.sqrt(chiSquare / n) : 0,
    minimumExpected: Number.isFinite(minimumExpected) ? minimumExpected : 0,
  };
}

export function adjustHolm<T extends { pValue: number }>(results: T[]): Array<T & { adjustedPValue: number }> {
  const sorted = results.map((result, index) => ({ result, index })).sort((a, b) => a.result.pValue - b.result.pValue);
  const adjusted = new Array<number>(results.length);
  let previous = 0;
  sorted.forEach((entry, rank) => {
    const value = Math.min(1, entry.result.pValue * (results.length - rank));
    previous = Math.max(previous, value);
    adjusted[entry.index] = previous;
  });
  return results.map((result, index) => ({ ...result, adjustedPValue: adjusted[index] }));
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  return 0.5 * (1 + erf);
}

export type OddsRatioResult = { name: string; definition: string; oddsRatio: number; lower: number; upper: number; pValue: number; exposedN: number; referenceN: number };

export function employmentOddsRatio(records: TvetRecord[], name: string, definition: string, exposed: (record: TvetRecord) => boolean, reference: (record: TvetRecord) => boolean): OddsRatioResult {
  const exposedRows = records.filter(exposed);
  const referenceRows = records.filter(reference);
  let a = exposedRows.filter(isEmployed).length;
  let b = exposedRows.length - a;
  let c = referenceRows.filter(isEmployed).length;
  let d = referenceRows.length - c;
  if ([a, b, c, d].some((value) => value === 0)) { a += 0.5; b += 0.5; c += 0.5; d += 0.5; }
  const oddsRatio = (a * d) / (b * c);
  const standardError = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const logOdds = Math.log(oddsRatio);
  const z = standardError ? logOdds / standardError : 0;
  return {
    name, definition, oddsRatio,
    lower: Math.exp(logOdds - 1.96 * standardError),
    upper: Math.exp(logOdds + 1.96 * standardError),
    pValue: 2 * (1 - normalCdf(Math.abs(z))),
    exposedN: exposedRows.length,
    referenceN: referenceRows.length,
  };
}
