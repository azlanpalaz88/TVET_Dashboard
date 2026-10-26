"use client";

import { ChangeEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, RefreshCw, X } from "lucide-react";
import { parseCsvText, parseUpload, validateRecords, ValidationResult } from "@/lib/importer";
import { DataSource, SCHEMA_FIELDS, TvetRecord } from "@/lib/schema";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (records: TvetRecord[], source: DataSource) => void;
};

export function ImportPanel({ open, onClose, onApply }: Props) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [preview, setPreview] = useState<TvetRecord[]>([]);
  const [mapped, setMapped] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  if (!open) return null;

  async function inspectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true); setError("");
    try {
      const parsed = await parseUpload(file);
      setMapped(Object.keys(parsed.mapping)); setPreview(parsed.records.slice(0, 5));
      setResult(validateRecords(parsed.records));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Fail tidak dapat dibaca."); }
    finally { setLoading(false); }
  }

  async function connectGoogleSheet() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/google-sheet?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error((await response.json()).error || "Google Sheet tidak dapat dicapai.");
      const text = await response.text();
      const { rows, headers } = parseCsvText(text);
      const { createMapping, normalizeRows } = await import("@/lib/importer");
      const mapping = createMapping(headers); const records = normalizeRows(rows, mapping);
      const validation = validateRecords(records);
      setMapped(Object.keys(mapping)); setPreview(records.slice(0, 5)); setResult(validation);
      if (validation.valid.length) {
        localStorage.setItem("tvetGoogleSheetUrl", url);
        onApply(validation.valid, "google-sheet");
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Sambungan gagal."); }
    finally { setLoading(false); }
  }

  const errors = result?.issues.filter((issue) => issue.severity === "ralat") ?? [];
  const warnings = result?.issues.filter((issue) => issue.severity === "amaran") ?? [];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Import data">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Pusat data</p><h2 className="mt-1 text-2xl font-bold">Import dan validasi</h2><p className="mt-2 text-sm text-slate-600">CSV normal, eksport mentah Google Forms, dan XLSX disokong tanpa menukar ID pemboleh ubah.</p></div><button onClick={onClose} className="rounded-lg border p-2" aria-label="Tutup"><X className="h-5 w-5" /></button></div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neon/30 bg-blush p-5 text-center hover:border-neon"><FileSpreadsheet className="mb-3 h-8 w-8 text-neon" /><strong>Muat naik CSV / XLSX</strong><span className="mt-1 text-xs text-slate-500">Pilih fail anonim sahaja</span><input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={inspectFile} /></label>
          <div className="rounded-2xl border border-slate-200 p-5"><strong className="block">Google Sheet auto-kemas kini</strong><p className="mt-1 text-xs text-slate-500">Tampal URL CSV helaian yang diterbitkan. Dashboard menyimpan URL secara setempat dan menyegar setiap 60 saat.</p><input className="mt-4 w-full rounded-lg border px-3 py-2 text-sm" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/.../export?format=csv" /><button onClick={connectGoogleSheet} disabled={!url || loading} className="mt-3 flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"><RefreshCw className="h-4 w-4" />Sambung helaian</button></div>
        </div>
        {loading && <div className="mt-6 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Memproses data...</div>}
        {error && <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
        {result && <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4"><Summary label="Rekod sah" value={result.valid.length} tone="ok" /><Summary label="Medan dipetakan" value={`${mapped.length}/${SCHEMA_FIELDS.length}`} tone={mapped.length === SCHEMA_FIELDS.length ? "ok" : "warn"} /><Summary label="Ralat" value={errors.length} tone={errors.length ? "bad" : "ok"} /><Summary label="Amaran" value={warnings.length} tone={warnings.length ? "warn" : "ok"} /></div>
          <div className="mt-6"><h3 className="font-bold">Pratonton import</h3><div className="mt-3 overflow-x-auto rounded-xl border"><table className="min-w-[700px] text-left text-xs"><thead className="bg-slate-100"><tr>{["respondent_id", "programme", "employment_status", "monthly_income_rm"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{preview.map((row) => <tr className="border-t" key={row.respondent_id}><td className="p-3">{row.respondent_id}</td><td className="p-3">{row.programme}</td><td className="p-3">{row.employment_status}</td><td className="p-3">{row.monthly_income_rm || "Kosong"}</td></tr>)}</tbody></table></div></div>
          {!!result.issues.length && <div className="mt-6"><h3 className="font-bold">Log validasi</h3><div className="mt-3 max-h-52 overflow-y-auto rounded-xl border">{result.issues.slice(0, 100).map((issue, index) => <div className="flex gap-3 border-b p-3 text-xs" key={`${issue.row}-${issue.field}-${index}`}><span className={issue.severity === "ralat" ? "font-bold text-red-600" : "font-bold text-amber-600"}>{issue.severity.toUpperCase()}</span><span>Baris {issue.row}, <code>{issue.field}</code>: {issue.message}</span></div>)}</div></div>}
          <Button variant="neon" onClick={() => onApply(result.valid, "import")} disabled={!result.valid.length} className="mt-6 h-12 px-5"><CheckCircle2 className="h-5 w-5" />Gunakan {result.valid.length} rekod sah</Button>
        </>}
        <p className="mt-8 rounded-xl bg-slate-100 p-4 text-xs leading-5 text-slate-600"><strong>Privasi:</strong> Import di pelayar ini tidak dihantar ke pangkalan data. Walau bagaimanapun, helaian Google yang diterbitkan ialah pautan awam. Untuk produksi, gunakan storan terlindung, autentikasi, kawalan peranan dan penindasan sel kecil.</p>
      </div>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string | number; tone: "ok" | "warn" | "bad" }) {
  return <div className={`rounded-xl p-4 ${tone === "ok" ? "bg-teal/10 text-teal" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}><div className="text-2xl font-black">{value}</div><div className="mt-1 text-xs font-bold">{label}</div></div>;
}
