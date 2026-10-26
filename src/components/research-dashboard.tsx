"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Papa from "papaparse";
import {
  BarChart3, BookOpenCheck, BriefcaseBusiness, ChevronDown, CircleUserRound,
  Database, Download, FileDown, Filter, GraduationCap, HeartHandshake, Menu,
  RefreshCw, ShieldCheck, Sparkles, Upload, X,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { applyFilters, automatedInsights, cohortTrend, crossTab, distribution, itemMeans, metrics, programmeComparison, skillDomainMeans } from "@/lib/analytics";
import { createMapping, normalizeRows, parseCsvText, validateRecords } from "@/lib/importer";
import { blankFilters, DataSource, filterFields, Filters, TvetRecord } from "@/lib/schema";
import { percent, ringgit } from "@/lib/utils";
import { ImportPanel } from "./import-panel";
import { RespondentTable } from "./data-table";

const COLORS = ["#F20D9A", "#102A43", "#0D9488", "#8B5CF6", "#F59E0B", "#38BDF8", "#FB7185", "#64748B"];
const NAV = [
  { id: "ringkasan", label: "Ringkasan Eksekutif", icon: BarChart3 },
  { id: "profil", label: "Profil Graduan", icon: CircleUserRound },
  { id: "pekerjaan", label: "Hasil Pekerjaan", icon: BriefcaseBusiness },
  { id: "kesediaan", label: "Kesediaan Kebolehpasaran", icon: GraduationCap },
  { id: "halangan", label: "Halangan Kerjaya", icon: HeartHandshake },
  { id: "penyelidikan", label: "Analitik Penyelidikan", icon: BookOpenCheck },
] as const;
type ModuleId = (typeof NAV)[number]["id"];

const FILTER_LABELS: Record<keyof Filters, string> = {
  graduation_year: "Kohort", institution_type: "Institusi", qualification: "Kelayakan",
  programme: "Program", state: "Negeri", age_group: "Umur", employment_status: "Status pekerjaan",
};

export function ResearchDashboard() {
  const [records, setRecords] = useState<TvetRecord[]>([]);
  const [source, setSource] = useState<DataSource>("simulasi");
  const [active, setActive] = useState<ModuleId>("ringkasan");
  const [filters, setFilters] = useState<Filters>(blankFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/TVET_Wanita_Data_Dummy_400.csv").then((response) => response.text()).then((text) => {
      const { rows, headers } = parseCsvText(text);
      setRecords(validateRecords(normalizeRows(rows, createMapping(headers))).valid);
      setLastUpdated(new Date());
    });
  }, []);

  useEffect(() => {
    const url = localStorage.getItem("tvetGoogleSheetUrl");
    if (!url) return;
    const refresh = async () => {
      setSyncing(true);
      try {
        const response = await fetch(`/api/google-sheet?url=${encodeURIComponent(url)}`, { cache: "no-store" });
        if (!response.ok) return;
        const { rows, headers } = parseCsvText(await response.text());
        const validation = validateRecords(normalizeRows(rows, createMapping(headers)));
        if (validation.valid.length) { setRecords(validation.valid); setSource("google-sheet"); setLastUpdated(new Date()); }
      } finally { setSyncing(false); }
    };
    void refresh(); const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);
  const options = useMemo(() => Object.fromEntries(filterFields.map((field) => [field, [...new Set(records.map((record) => record[field]))].filter(Boolean).sort()])), [records]);
  const activeFilterCount = Object.values(filters).filter((value) => value !== "Semua").length;

  function applyImported(next: TvetRecord[], nextSource: DataSource) {
    setRecords(next); setSource(nextSource); setFilters(blankFilters()); setLastUpdated(new Date()); setImportOpen(false);
  }

  async function downloadPng() {
    if (!reportRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#f7f9fc" });
    const link = document.createElement("a"); link.download = `laporan-tvet-${active}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  }

  async function downloadPdf() {
    if (!reportRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(reportRef.current, { scale: 1.5, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const width = 277; const height = canvas.height * width / canvas.width;
    pdf.addImage(canvas.toDataURL("image/jpeg", .92), "JPEG", 10, 10, width, Math.min(height, 190));
    pdf.save(`laporan-tvet-${active}.pdf`);
  }

  function downloadCsv() {
    const blob = new Blob([Papa.unparse(filtered, { columns: Object.keys(filtered[0] ?? {}) })], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.download = "rekod-tvet-ditapis.csv"; link.href = URL.createObjectURL(blob); link.click(); URL.revokeObjectURL(link.href);
  }

  return (
    <div className="min-h-screen lg:pl-[280px]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[280px] transform border-r border-white/10 bg-navy text-white transition lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5"><div className="rounded-xl bg-white p-2"><Image src="/logo-usm.webp" alt="Logo rasmi Universiti Sains Malaysia" width={600} height={114} className="h-14 w-full object-contain" priority /></div><p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-pink-300">Pusat Analitik Penyelidikan</p><h1 className="mt-2 text-lg font-black leading-snug">Graduan Wanita TVET Malaysia</h1></div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Modul dashboard">{NAV.map((item) => <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${active === item.id ? "bg-neon text-white shadow-neon" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><item.icon className="h-5 w-5" />{item.label}</button>)}</nav>
          <div className="m-4 rounded-xl border border-pink-400/30 bg-pink-400/10 p-4 text-xs leading-5 text-pink-100"><ShieldCheck className="mb-2 h-5 w-5" /><strong>Data anonim sahaja.</strong><br />Tiada nama, e-mel atau nombor pengenalan dipaparkan.</div>
        </div>
      </aside>
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-navy/50 lg:hidden" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} />}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl md:px-7">
        <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="rounded-lg border p-2 lg:hidden" aria-label="Buka menu"><Menu className="h-5 w-5" /></button><div className="min-w-0"><p className="eyebrow">{NAV.find((item) => item.id === active)?.label}</p><h2 className="truncate text-lg font-black md:text-xl">Dashboard Penyelidikan Kebolehpasaran Wanita TVET</h2></div></div><div className="flex items-center gap-2"><button onClick={() => setFilterOpen(!filterOpen)} className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"><Filter className="h-4 w-4" /><span className="hidden sm:inline">Penapis</span>{activeFilterCount > 0 && <span className="rounded-full bg-neon px-1.5 text-[10px] text-white">{activeFilterCount}</span>}</button><button onClick={() => setImportOpen(true)} className="flex items-center gap-2 rounded-xl bg-navy px-3 py-2 text-sm font-bold text-white"><Upload className="h-4 w-4" /><span className="hidden sm:inline">Import data</span></button></div></div>
        {filterOpen && <FilterPanel filters={filters} options={options as Record<keyof Filters, string[]>} onChange={setFilters} onClose={() => setFilterOpen(false)} />}
      </header>
      <main className="p-4 md:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ${source === "simulasi" ? "bg-neon text-white" : "bg-teal text-white"}`}>{source === "simulasi" ? "DATA SIMULASI" : source === "google-sheet" ? "GOOGLE SHEET" : "DATA IMPORT"}</span><span className="text-xs text-slate-500">{filtered.length} daripada {records.length} rekod · Dikemas kini {lastUpdated?.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" }) ?? "-"}</span>{syncing && <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal" />}</div>
          <div className="no-print flex flex-wrap gap-2"><ExportButton icon={Database} label="CSV" onClick={downloadCsv} /><ExportButton icon={Download} label="PNG" onClick={downloadPng} /><ExportButton icon={FileDown} label="PDF" onClick={downloadPdf} /></div>
        </div>
        <div ref={reportRef}>
          {source === "simulasi" && <div className="mb-5 flex gap-3 rounded-2xl border border-pink-200 bg-blush p-4 text-sm text-pink-950"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-neon" /><p><strong>DATA SIMULASI.</strong> Semua dapatan yang dipaparkan ialah demonstrasi teknikal dan bukan bukti empirikal, kadar rasmi atau hasil kajian sebenar.</p></div>}
          {active === "ringkasan" && <Executive records={filtered} />}
          {active === "profil" && <Profile records={filtered} />}
          {active === "pekerjaan" && <Employment records={filtered} />}
          {active === "kesediaan" && <Readiness records={filtered} />}
          {active === "halangan" && <Barriers records={filtered} />}
          {active === "penyelidikan" && <Research records={filtered} allRecords={records} />}
        </div>
      </main>
      <ImportPanel open={importOpen} onClose={() => setImportOpen(false)} onApply={applyImported} />
    </div>
  );
}

function FilterPanel({ filters, options, onChange, onClose }: { filters: Filters; options: Record<keyof Filters, string[]>; onChange: (filters: Filters) => void; onClose: () => void }) {
  return <div className="absolute left-3 right-3 top-[76px] rounded-2xl border bg-white p-5 shadow-2xl md:left-auto md:right-7 md:w-[760px]"><div className="mb-4 flex items-center justify-between"><div><strong>Penapis global</strong><p className="text-xs text-slate-500">Semua kad, carta dan jadual berubah serentak.</p></div><button onClick={onClose} aria-label="Tutup penapis"><X className="h-5 w-5" /></button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filterFields.map((field) => <label className="text-xs font-bold text-slate-600" key={field}>{FILTER_LABELS[field]}<span className="relative mt-1 block"><select className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-8 font-normal text-navy" value={filters[field]} onChange={(e) => onChange({ ...filters, [field]: e.target.value })}><option>Semua</option>{options[field].map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4" /></span></label>)}</div><button className="mt-4 text-xs font-bold text-neon" onClick={() => onChange(blankFilters())}>Tetapkan semula semua penapis</button></div>;
}

function Executive({ records }: { records: TvetRecord[] }) {
  const kpi = metrics(records); const programmes = programmeComparison(records); const statuses = distribution(records, "employment_status");
  return <Module title="Ringkasan eksekutif" description="Petunjuk utama dengan pembilang dan penyebut yang telus.">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Kpi label="Responden sah" value={kpi.respondents.toLocaleString("ms-MY")} detail="Persetujuan=Ya; layak=Ya" /><Kpi label="Proporsi bekerja" value={percent(kpi.employed.value)} detail={`${kpi.employed.numerator} / ${kpi.employed.denominator}`} accent /><Kpi label="Kadar bekerja tenaga buruh" value={percent(kpi.labour.value)} detail={`${kpi.labour.numerator} / ${kpi.labour.denominator}`} /><Kpi label="Padanan tepat bidang" value={percent(kpi.match.value)} detail={`${kpi.match.numerator} / ${kpi.match.denominator} respons sah`} /><Kpi label="Median pendapatan" value={ringgit(kpi.salary.value)} detail={`n=${kpi.salary.denominator}; ${kpi.salary.missing} tidak menjawab`} /></div>
    <Insights records={records} />
    <div className="grid gap-5 xl:grid-cols-2"><ChartPanel title="Kategori status pekerjaan" note="Peratus daripada semua responden sah"><ResponsiveContainer width="100%" height={310}><PieChart><Pie data={statuses} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={62} outerRadius={100} paddingAngle={2}>{statuses.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></ChartPanel><ChartPanel title="Perbandingan program" note="Proporsi bekerja dalam setiap program (%)"><ResponsiveContainer width="100%" height={310}><BarChart data={programmes} layout="vertical" margin={{ left: 35 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} /><YAxis type="category" dataKey="name" width={125} tick={{ fontSize: 10 }} /><Tooltip /><Legend /><Bar dataKey="bekerja" name="Bekerja" stackId="a" fill="#F20D9A" /><Bar dataKey="tidakBekerja" name="Tidak bekerja" stackId="a" fill="#CBD5E1" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></ChartPanel></div>
  </Module>;
}

function Profile({ records }: { records: TvetRecord[] }) {
  return <Module title="Profil graduan" description="Komposisi demografi dan pengalaman pendidikan responden."><div className="grid gap-5 lg:grid-cols-2"><SimpleBar title="Kumpulan umur" data={distribution(records, "age_group")} /><SimpleBar title="Jenis institusi TVET" data={distribution(records, "institution_type")} /><SimpleBar title="Bidang program" data={distribution(records, "programme")} /><SimpleBar title="Kelayakan tertinggi" data={distribution(records, "qualification")} /></div><div className="grid gap-5 lg:grid-cols-3"><StatBlock title="Latihan industri" data={distribution(records, "internship")} /><StatBlock title="Tempoh latihan industri" data={distribution(records, "internship_duration")} /><StatBlock title="Bimbingan kerjaya" data={distribution(records, "career_guidance")} /></div><ChartPanel title="Taburan negeri" note="Negeri tempat tinggal semasa"><ResponsiveContainer width="100%" height={340}><BarChart data={distribution(records, "state")}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" angle={-32} textAnchor="end" height={100} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="value" name="Responden" fill="#102A43" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartPanel></Module>;
}

function Employment({ records }: { records: TvetRecord[] }) {
  const employed = records.filter((record) => record.employment_status.startsWith("Bekerja"));
  const salaryBands = [
    { name: "< RM2,000", value: employed.filter((r) => +r.monthly_income_rm > 0 && +r.monthly_income_rm < 2000).length },
    { name: "RM2,000–2,999", value: employed.filter((r) => +r.monthly_income_rm >= 2000 && +r.monthly_income_rm < 3000).length },
    { name: "RM3,000–3,999", value: employed.filter((r) => +r.monthly_income_rm >= 3000 && +r.monthly_income_rm < 4000).length },
    { name: "≥ RM4,000", value: employed.filter((r) => +r.monthly_income_rm >= 4000).length },
  ].map((x) => ({ ...x, percent: employed.length ? x.value / employed.length : 0 }));
  return <Module title="Hasil pekerjaan" description="Status semasa tidak disamakan dengan konstruk teori kebolehpasaran."><div className="grid gap-5 lg:grid-cols-2"><SimpleBar title="Status pekerjaan" data={distribution(records, "employment_status")} /><SimpleBar title="Sektor pekerjaan" data={distribution(employed, "employment_sector")} /><SimpleBar title="Jenis pekerjaan" data={distribution(employed, "employment_type")} /><SimpleBar title="Padanan kerja dengan bidang" data={distribution(employed, "job_match")} /><SimpleBar title="Pendapatan bulanan" data={salaryBands} /><SimpleBar title="Masa ke pekerjaan pertama" data={distribution(employed, "first_job_delay")} /></div></Module>;
}

function Readiness({ records }: { records: TvetRecord[] }) {
  const domains = skillDomainMeans(records); const items = itemMeans(records, "S");
  return <Module title="Kesediaan kebolehpasaran" description="S01–S15 pada skala 1 hingga 5; skor lebih tinggi menunjukkan persetujuan lebih tinggi."><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Nota metodologi:</strong> Lima domain di bawah ialah pengelompokan cadangan untuk visualisasi, bukan konstruk laten yang telah disahkan. Analisis faktor, kebolehpercayaan dan kesahan diperlukan sebelum inferens psikometrik.</div><ChartPanel title="Purata domain cadangan" note="Purata respons sah; julat 1–5"><ResponsiveContainer width="100%" height={330}><BarChart data={domains}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 5]} /><Tooltip formatter={(value) => Number(value).toFixed(2)} /><Bar dataKey="value" name="Purata" fill="#F20D9A" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></ChartPanel><div className="panel overflow-hidden"><div className="border-b p-5"><h3 className="font-bold">Analisis item individu</h3><p className="text-xs text-slate-500">Setiap item kekal dilaporkan secara berasingan.</p></div><div className="divide-y">{items.map((item) => <div className="grid items-center gap-3 p-4 md:grid-cols-[72px_1fr_1fr_80px]" key={item.field}><strong className="text-neon">{item.field}</strong><span className="text-sm">{item.name}</span><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-navy to-neon" style={{ width: `${item.value / 5 * 100}%` }} /></div><span className="text-right text-sm font-black">{item.value.toFixed(2)} <small className="font-normal text-slate-400">n={item.n}</small></span></div>)}</div></div></Module>;
}

function Barriers({ records }: { records: TvetRecord[] }) {
  const items = itemMeans(records, "B");
  return <Module title="Halangan kerjaya" description="Pengalaman halangan yang dilaporkan sendiri; ‘Tidak berkenaan’ tidak dikodkan sebagai sifar."><div className="grid gap-4 md:grid-cols-3">{items.map((item, index) => <div className="panel border-t-4 p-5" style={{ borderTopColor: COLORS[index] }} key={item.field}><span className="eyebrow">{item.field}</span><h3 className="mt-2 min-h-12 font-bold">{item.name}</h3><div className="mt-5 text-4xl font-black">{item.value.toFixed(2)}<span className="text-base text-slate-400"> / 5</span></div><p className="mt-2 text-xs text-slate-500">n sah={item.n} · Tidak berkenaan/tiada data={item.na}</p></div>)}</div><SimpleBar title="Halangan utama" data={distribution(records, "main_barrier")} horizontal /><div className="grid gap-5 lg:grid-cols-3">{(["B01", "B02", "B03"] as const).map((field) => <StatBlock key={field} title={`Taburan ${field}`} data={distribution(records, field)} />)}</div></Module>;
}

function Research({ records, allRecords }: { records: TvetRecord[]; allRecords: TvetRecord[] }) {
  const validation = validateRecords(allRecords); const trend = cohortTrend(records); const table = crossTab(records, "institution_type", "employment_status");
  const maxCell = Math.max(1, ...table.values.flat());
  return <Module title="Analitik penyelidikan" description="Statistik deskriptif, kualiti data, silang jadual dan dokumentasi kaedah."><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Kelengkapan rekod" value={percent(allRecords.length ? validation.valid.length / allRecords.length : 0)} detail={`${validation.valid.length}/${allRecords.length} lulus validasi`} /><Kpi label="ID berulang" value={String(validation.duplicates)} detail="Semakan respondent_id" /><Kpi label="Ralat validasi" value={String(validation.issues.filter((i) => i.severity === "ralat").length)} detail="Kategori, julat dan gaji" /><Kpi label="Amaran percabangan" value={String(validation.issues.filter((i) => i.severity === "amaran").length)} detail="Konsistensi laluan borang" /></div><ChartPanel title="Kadar bekerja mengikut kohort" note="Perbandingan deskriptif; bukan kesan kohort kausal"><ResponsiveContainer width="100%" height={300}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Line dataKey="kadar" name="Kadar bekerja" stroke="#F20D9A" strokeWidth={4} dot={{ r: 5, fill: "#102A43" }} /></LineChart></ResponsiveContainer></ChartPanel><div className="panel overflow-hidden"><div className="p-5"><h3 className="font-bold">Peta haba: institusi × status pekerjaan</h3><p className="text-xs text-slate-500">Kekerapan sel; warna lebih pekat menunjukkan bilangan lebih tinggi.</p></div><div className="overflow-x-auto p-5 pt-0"><table className="min-w-[900px] text-center text-xs"><thead><tr><th className="p-2 text-left">Institusi</th>{table.cols.map((col) => <th className="max-w-28 p-2 align-bottom" key={col}>{col}</th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={row}><th className="p-2 text-left">{row}</th>{table.values[rowIndex].map((value, colIndex) => <td key={table.cols[colIndex]} className="border-2 border-white p-3 font-bold" style={{ backgroundColor: `rgba(242,13,154,${.08 + .82 * value / maxCell})`, color: value / maxCell > .55 ? "white" : "#102A43" }}>{value}</td>)}</tr>)}</tbody></table></div></div><div className="panel p-5"><h3 className="font-bold">Jadual responden anonim</h3><p className="mb-5 mt-1 text-xs text-slate-500">Carian, susunan lajur dan navigasi halaman tersedia. Medan pengenalan peribadi tidak dimuatkan.</p><RespondentTable records={records} /></div><Methodology /></Module>;
}

function Methodology() {
  return <div className="grid gap-5 lg:grid-cols-2"><div className="panel p-6"><p className="eyebrow">Definisi indikator</p><h3 className="mt-1 text-xl font-black">Kaedah pengiraan</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li><strong>Proporsi bekerja:</strong> bekerja / semua responden sah dan layak.</li><li><strong>Kadar tenaga buruh:</strong> bekerja / (bekerja + tidak bekerja yang aktif mencari).</li><li><strong>Padanan kerja:</strong> kerja tepat sepadan / responden bekerja dengan jawapan padanan sah.</li><li><strong>Median gaji:</strong> nilai positif sah dalam kalangan responden bekerja.</li><li><strong>B01–B03:</strong> “Tidak berkenaan” dikecualikan, bukan diberikan skor sifar.</li></ul></div><div className="panel p-6"><p className="eyebrow">Pelan keselamatan produksi</p><h3 className="mt-1 text-xl font-black">Tadbir urus dan privasi</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>Autentikasi institusi dan peranan: pentadbir, penyelidik, pembaca.</li><li>Storan disulitkan, log audit, sandaran dan pengurusan rahsia pelayan.</li><li>ID pseudonim stabil; asingkan kunci pautan daripada set analitik.</li><li>Penindasan sel kecil, dicadangkan n&lt;5, sebelum eksport atau perkongsian.</li><li>Google Sheets awam hanya untuk demo; guna OAuth/API terkawal bagi produksi.</li></ul></div></div>;
}

function Module({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="space-y-5"><div><p className="eyebrow">Analisis akademik</p><h2 className="mt-1 text-2xl font-black md:text-3xl">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{children}</section>; }
function Kpi({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) { return <div className={`panel relative overflow-hidden p-5 ${accent ? "border-neon/30 shadow-neon" : ""}`}><div className={`absolute inset-x-0 top-0 h-1 ${accent ? "bg-neon" : "bg-teal"}`} /><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><div className="mt-3 text-3xl font-black tracking-tight">{value}</div><p className="mt-2 text-xs text-slate-500">{detail}</p></div>; }
function ChartPanel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) { return <div className="panel p-5"><h3 className="font-bold">{title}</h3><p className="mb-4 mt-1 text-xs text-slate-500">{note}</p>{children}</div>; }
function SimpleBar({ title, data, horizontal = false }: { title: string; data: { name: string; value: number; percent: number }[]; horizontal?: boolean }) { const height = Math.max(270, data.length * (horizontal ? 34 : 20)); return <ChartPanel title={title} note="Bilangan responden dan peratus respons sah"><ResponsiveContainer width="100%" height={height}><BarChart data={data} layout="vertical" margin={{ left: horizontal ? 85 : 35 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={horizontal ? 180 : 125} tick={{ fontSize: 10 }} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="value" name="Responden" fill="#F20D9A" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></ChartPanel>; }
function StatBlock({ title, data }: { title: string; data: { name: string; value: number; percent: number }[] }) { return <div className="panel p-5"><h3 className="font-bold">{title}</h3><div className="mt-4 space-y-3">{data.map((item, index) => <div key={item.name}><div className="flex justify-between gap-3 text-xs"><span>{item.name}</span><strong>{item.value} · {percent(item.percent)}</strong></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${item.percent * 100}%`, background: COLORS[index % COLORS.length] }} /></div></div>)}</div></div>; }
function Insights({ records }: { records: TvetRecord[] }) { return <div className="panel border-l-4 border-l-neon p-5"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-neon" /><h3 className="font-bold">Insight deskriptif automatik</h3></div><ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 lg:grid-cols-2">{automatedInsights(records).map((insight) => <li key={insight}>• {insight}</li>)}</ul></div>; }
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; payload?: { percent?: number } }>; label?: string }) { if (!active || !payload?.length) return null; return <div className="max-w-64 rounded-xl border bg-white p-3 text-xs shadow-xl"><strong>{label || payload[0].payload?.["name" as never]}</strong>{payload.map((item) => <p className="mt-1" key={item.name}>{item.name}: <b>{item.value}</b>{item.payload?.percent !== undefined ? ` (${percent(item.payload.percent)})` : ""}</p>)}</div>; }
function ExportButton({ icon: Icon, label, onClick }: { icon: typeof Download; label: string; onClick: () => void }) { return <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold hover:border-neon hover:text-neon"><Icon className="h-3.5 w-3.5" />{label}</button>; }
