import { z } from "zod";

export const SCHEMA_FIELDS = [
  "respondent_id", "consent", "eligible", "age_group", "state",
  "institution_type", "qualification", "programme", "graduation_year",
  "internship", "internship_duration", "career_guidance", "employment_status",
  "employment_sector", "employment_type", "job_match", "monthly_income_rm",
  "first_job_delay", "job_search_duration", "nonemployment_reason",
  "S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09",
  "S10", "S11", "S12", "S13", "S14", "S15", "B01", "B02", "B03",
  "main_barrier",
] as const;

export type FieldId = (typeof SCHEMA_FIELDS)[number];
export type TvetRecord = Record<FieldId, string>;
export type DataSource = "simulasi" | "import" | "google-sheet";

export const EMPLOYED_STATUSES = [
  "Bekerja sepenuh masa",
  "Bekerja separuh masa",
  "Bekerja sendiri",
] as const;

export const CATEGORY_OPTIONS: Partial<Record<FieldId, readonly string[]>> = {
  consent: ["Ya, saya bersetuju", "Tidak, saya tidak bersetuju"],
  eligible: ["Ya", "Tidak"],
  age_group: ["18–20 tahun", "21–24 tahun", "25–29 tahun", "30–34 tahun", "35 tahun dan ke atas"],
  state: ["Pulau Pinang", "Kedah", "Perak", "Selangor", "Kuala Lumpur", "Johor", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"],
  institution_type: ["Politeknik", "Kolej Komuniti", "ILP / ADTEC", "IKM / KKTM", "Kolej Vokasional", "Institusi TVET Swasta"],
  qualification: ["Sijil TVET", "Diploma TVET", "Diploma Lanjutan TVET"],
  programme: ["Teknologi Maklumat & Digital", "Elektrik & Elektronik", "Automotif", "Hospitaliti & Pelancongan", "Kulinari & Bakeri", "Fesyen & Rekaan", "Mekatronik & Pembuatan", "Perniagaan & Pengurusan", "Pembinaan & Seni Bina"],
  graduation_year: ["2021", "2022", "2023", "2024", "2025", "2026"],
  internship: ["Ya", "Tidak"],
  internship_duration: ["Tiada", "1–3 bulan", "4–6 bulan", "Lebih 6 bulan"],
  career_guidance: ["Ya", "Tidak", "Tidak pasti"],
  employment_status: [...EMPLOYED_STATUSES, "Tidak bekerja, sedang mencari pekerjaan", "Tidak bekerja, tidak sedang mencari pekerjaan", "Menyambung pengajian sepenuh masa (tidak bekerja)"],
  employment_sector: ["Swasta", "Kerajaan", "NGO / organisasi sosial", "Perniagaan sendiri", "Lain-lain"],
  employment_type: ["Tetap", "Kontrak", "Sambilan", "Bekerja sendiri"],
  job_match: ["Sepadan", "Sebahagiannya sepadan", "Tidak sepadan"],
  first_job_delay: ["Sebelum tamat pengajian", "Kurang 1 bulan", "1–3 bulan", "4–6 bulan", "7–12 bulan", "Lebih 12 bulan"],
  job_search_duration: ["Tidak mencari pekerjaan", "Kurang 1 bulan", "1–3 bulan", "4–6 bulan", "7–12 bulan", "Lebih 12 bulan"],
  nonemployment_reason: ["Belum menerima tawaran yang sesuai", "Sedang menyambung pengajian", "Belum memulakan pencarian kerja", "Komitmen keluarga / peribadi", "Lokasi atau pengangkutan", "Lain-lain"],
  main_barrier: ["Peluang kerja dalam bidang terhad", "Gaji ditawarkan tidak memadai", "Majikan memerlukan pengalaman kerja", "Kekangan lokasi / pengangkutan", "Stereotaip gender", "Komitmen keluarga / penjagaan", "Tidak menghadapi halangan utama", "Lain-lain"],
};

export const SKILL_DOMAINS = [
  { name: "Kompetensi teknikal", fields: ["S01", "S02", "S03"] },
  { name: "Kemahiran insaniah", fields: ["S04", "S05", "S06"] },
  { name: "Kemahiran digital", fields: ["S07", "S08", "S09"] },
  { name: "Kesediaan kerjaya", fields: ["S10", "S11", "S12"] },
  { name: "Sokongan institusi", fields: ["S13", "S14", "S15"] },
] as const;

export const QUESTION_LABELS: Partial<Record<FieldId, string>> = {
  S01: "Penguasaan kemahiran teknikal", S02: "Penggunaan peralatan/teknologi khusus",
  S03: "Penyelesaian masalah teknikal", S04: "Komunikasi di tempat kerja",
  S05: "Kerjasama berpasukan", S06: "Kebolehsuaian",
  S07: "Aplikasi digital pekerjaan", S08: "Pembelajaran teknologi baharu",
  S09: "Alat digital untuk tugasan", S10: "Keyakinan temu duga",
  S11: "Memahami jangkaan majikan", S12: "Kesediaan mengambil peluang",
  S13: "Maklumat peluang pekerjaan", S14: "Memahami tuntutan pekerjaan",
  S15: "Bimbingan persediaan kerjaya", B01: "Stereotaip gender",
  B02: "Lokasi atau pengangkutan", B03: "Tanggungjawab keluarga/penjagaan",
};

export const filterFields = ["graduation_year", "institution_type", "qualification", "programme", "state", "age_group", "employment_status"] as const;
export type FilterField = (typeof filterFields)[number];
export type Filters = Record<FilterField, string>;

export const blankFilters = (): Filters => Object.fromEntries(filterFields.map((field) => [field, "Semua"])) as Filters;

export const recordSchema = z.object(
  Object.fromEntries(SCHEMA_FIELDS.map((field) => [field, z.string()])) as Record<FieldId, z.ZodString>,
);

export const isEmployed = (record: TvetRecord) => EMPLOYED_STATUSES.includes(record.employment_status as (typeof EMPLOYED_STATUSES)[number]);
