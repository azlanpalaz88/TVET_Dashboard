# TVET Women Employability Research Dashboard

Dashboard penyelidikan responsif untuk analisis kebolehpasaran graduan wanita TVET Malaysia. Semua antara muka, nota metodologi dan laporan dijana dalam Bahasa Melayu Malaysia. Set lalai mengandungi **400 rekod DATA SIMULASI** dan tidak boleh ditafsirkan sebagai dapatan sebenar.

## Persediaan tepat

Keperluan: Node.js 20 atau lebih baharu dan npm.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Semakan produksi:

```bash
npm test
npm run build
npm start
```

## Inventori skema sumber

Skema dibina selepas pemeriksaan `TVET_Wanita_Data_Dummy_400.csv`, `TVET_Wanita_Kamus_Data.csv`, `TVET_Wanita_Google_Form.gs` dan utiliti normalisasi. Tiada ID pemboleh ubah dinamakan semula.

- Sistem/persetujuan: `respondent_id`, `consent`, `eligible`
- Profil: `age_group`, `state`, `institution_type`, `qualification`, `programme`, `graduation_year`, `internship`, `internship_duration`, `career_guidance`, `employment_status`
- Pekerjaan: `employment_sector`, `employment_type`, `job_match`, `monthly_income_rm`, `first_job_delay`
- Belum bekerja: `job_search_duration`, `nonemployment_reason`
- Kesediaan: `S01` hingga `S15`
- Halangan: `B01`, `B02`, `B03`, `main_barrier`

`S01–S15` dipaparkan dalam lima domain cadangan sahaja dan bukan konstruk laten disahkan. Nilai `Tidak berkenaan` untuk B01–B03 dikecualikan daripada min.

## Seni bina

- `src/app`: App Router, gaya global dan proksi Google Sheet terkawal hos.
- `src/lib/schema.ts`: 39 pemboleh ubah kanonik, kategori dan domain cadangan.
- `src/lib/importer.ts`: CSV/XLSX, pemetaan tajuk `[variable_id]`, Zod dan validasi cabang.
- `src/lib/analytics.ts`: formula KPI, deskriptif, silang jadual, penapis dan insight.
- `src/components`: ruang kerja, visual Recharts, TanStack Table dan pusat import.
- `tests`: formula KPI, pemetaan CSV, missing values, validasi dan penapis global.
- `netlify/functions`: fungsi proksi pilihan untuk deployment Netlify.

Data prototaip diproses di pelayar. Tiada pangkalan data atau rekod pengguna luaran diperlukan.

## Senarai halaman/modul

1. Ringkasan Eksekutif
2. Profil Graduan
3. Hasil Pekerjaan
4. Kesediaan Kebolehpasaran
5. Halangan Kerjaya
6. Analitik Penyelidikan dan metodologi
7. Pusat Import CSV/XLSX/Google Forms melalui butang `Import data`

## Google Form auto-kemas kini

1. Cipta borang menggunakan `TVET_Wanita_Google_Form.gs` seperti panduan asal.
2. Dalam Apps Script pilih **Deploy > New deployment > Web app**.
3. Jalankan sebagai pemilik skrip. Pilih tahap akses mengikut kelulusan etika. Akses awam hanya sesuai untuk demo anonim.
4. Salin URL Web App berakhir `/exec`.
5. Di dashboard pilih `Import data`, tampal URL dan tekan `Sambung helaian`.
6. Dashboard mengambil snapshot penuh serta menyegar semula setiap 60 saat. Respons Google Form baharu akan muncul secara automatik.

Alternatifnya, terbitkan helaian sebagai CSV dan gunakan URL eksport. URL boleh ditetapkan pada pelayan melalui `GOOGLE_SHEET_CSV_URL` berdasarkan `.env.example`.

Eksport Forms mentah tidak mempunyai ID respons stabil. Prototaip menjana ID berdasarkan urutan baris. Produksi mesti menggunakan ID pseudonim kekal daripada integrasi API dan tidak bergantung pada kedudukan baris.

## Import dan eksport

- Import: CSV normal, CSV eksport Google Forms dan XLS/XLSX.
- Pratonton: pemetaan medan, lima rekod awal, jumlah sah, ralat dan amaran.
- Validasi: kategori, missing, Likert 1–5, gaji positif, duplikasi dan percabangan.
- Eksport: CSV rekod ditapis, PNG paparan modul dan PDF laporan modul.

## Netlify

Folder `netlify/functions` dan `netlify.toml` telah disediakan.

```bash
npm install
npx netlify dev
```

Untuk deployment, sambungkan repositori di Netlify. Arahan build ialah `npm run build`; plugin Next.js dan pengepala keselamatan ditetapkan dalam `netlify.toml`.

## Keselamatan produksi

- Gunakan autentikasi institusi dan kawalan peranan pentadbir/penyelidik/pembaca.
- Simpan data dalam storan disulitkan dan terlindung; rahsia hanya pada pelayan.
- Kekalkan log audit, tempoh retensi, sandaran dan prosedur pemadaman.
- Gunakan ID pseudonim stabil dan simpan kunci pautan secara berasingan.
- Lindungi integrasi Google dengan OAuth/akaun servis; jangan terbit data sebenar sebagai helaian awam.
- Laksanakan penindasan sel kecil, contohnya `n < 5`, sebelum paparan atau eksport berkongsi.
- Jangan masukkan nama, e-mel, nombor pengenalan atau medan bebas yang boleh mengenal pasti peserta.
- Hadkan saiz fail dan terima XLSX daripada sumber dipercayai sahaja. Pakej SheetJS komuniti dalam registri npm mempunyai advisori keselamatan tanpa versi pembaikan npm; nilai edisi berlesen/versi vendor atau penukaran XLSX di pelayan sebelum penggunaan produksi.

Logo rasmi USM menggunakan fail yang dibekalkan dalam projek. Penggunaan awam hendaklah mematuhi garis panduan identiti korporat dan kelulusan universiti.
