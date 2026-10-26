# Pakej demo dashboard: Kebolehpasaran graduan wanita TVET

## Kandungan

- `TVET_Wanita_Data_Dummy_400.csv` — **400 baris data SIMULASI**, 39 kolum termasuk ID. BUKAN dapatan kajian sebenar.
- `TVET_Wanita_Google_Form.gs` — skrip Google Apps Script untuk mencipta Google Form dan Google Sheet respons secara automatik.
- `TVET_Wanita_Kamus_Data.csv` — soalan, ID pemboleh ubah, jenis, pilihan jawapan, domain dan laluan.
- `TVET_Wanita_Normalisasi_Respons.py` — utiliti menukarkan eksport Google Form kepada struktur data dashboard.

## Cara membina Google Form

1. Pergi ke https://script.google.com/ dan cipta projek baharu.
2. Padam kod asal dalam `Code.gs`, kemudian tampal kandungan `TVET_Wanita_Google_Form.gs`.
3. Klik **Save**, pilih fungsi `createTVETWomenForm`, kemudian **Run**.
4. Benarkan kebenaran Google yang diminta untuk mencipta Forms dan Sheets.
5. Buka **Execution log** untuk mendapatkan pautan edit Google Form, pautan responden, dan Google Sheet respons.
6. Buka pratonton dan uji sekurang-kurangnya 4 laluan: tidak bersetuju, tidak layak, bekerja dan tidak bekerja.
7. Semak **Publish/Share**, akses responden, pengumpulan e-mel dan tetapan organisasi sebelum digunakan. Jangan edar draf untuk kutipan sebenar sebelum semakan pakar dan kelulusan etika yang relevan.

**Perhatian:** Menjalankan skrip mencipta borang baharu dalam akaun Google ANDA; fail `.gs` sahaja bukan pautan Google Form langsung.

## Import data dashboard

- Import `TVET_Wanita_Data_Dummy_400.csv` ke Cursor dashboard sebagai demo.
- Bagi respons sebenar, dalam Google Sheet respons pilih **File > Download > Comma Separated Values (.csv)** bagi sheet respons.
- Jalankan: `python TVET_Wanita_Normalisasi_Respons.py respons_google_forms.csv respons_dashboard.csv`.
- Import fail output ke dashboard. Penyerta tidak layak/tidak bersetuju ditapis. `respondent_id` dijana mengikut turutan fail import (bukan ID stabil untuk import berulang).
- Nama soalan Google Forms bermula `[variable_id]`; skrip normalisasi mengeluarkan ID tersebut dan mengabaikan metadata seperti Timestamp. Ambil perhatian output anonim ini hendaklah tetap disimpan dengan kawalan akses.

## Definisi indikator dashboard

- **Peratus bekerja daripada semua responden sah** = (Bekerja sepenuh masa + Bekerja separuh masa + Bekerja sendiri) / seluruh respons yang sah × 100.
- **Kadar bekerja dalam tenaga buruh bagi kajian ini** = jumlah bekerja / (jumlah bekerja + Tidak bekerja, sedang mencari pekerjaan) × 100. Pengelasan ini ialah pengoperasian sementara untuk dataset demo; jangan samakan automatik dengan pengelasan SKPG/KPT tanpa pemeriksaan metodologi.
- **Padanan tepat bidang** = bilangan bekerja dengan `job_match=Sepadan` / jumlah yang bekerja dan menjawab item padanan × 100.
- **Median pendapatan** = median nilai nombor `monthly_income_rm` dalam kalangan responden bekerja yang berkongsi nilai. Nyatakan `n` pendapatan dan berapa peratus tidak menjawab. Gaji data dummy bukan data pasaran sebenar.
- **Purata domain kemahiran** hanya sebagai demo visual untuk S01-S03 (teknikal), S04-S06 (insaniah), S07-S09 (digital), S10-S12 (kesediaan kerjaya), S13-S15 (sokongan institusi). B01-B03 adalah **item berasingan**, bukan skala psikometrik disahkan.
- **Missing**: `''` untuk tidak berkenaan disebabkan laluan borang / pendapatan pilihan; `Tidak berkenaan` pada B01-B03 adalah pilihan sah yang harus dikecualikan daripada pengiraan min item berkenaan.

## Ringkasan kandungan simulasi (untuk semakan teknikal sahaja)

- Jumlah rekod demo: 400.
- Bekerja: 287 daripada 400 (71.8%).
- Kerja sepadan tepat: 136 daripada 287 yang bekerja (47.4%).
- Median gaji yang menjawab dalam dummy: RM 3,000.
- Taburan status: {"Bekerja sepenuh masa": 238, "Tidak bekerja, sedang mencari pekerjaan": 81, "Menyambung pengajian sepenuh masa (tidak bekerja)": 20, "Bekerja sendiri": 19, "Bekerja separuh masa": 30, "Tidak bekerja, tidak sedang mencari pekerjaan": 12}.

## Peringatan metodologi

Instrumen **draf yang dijana untuk prototaip**, bukan instrumen sah bagi penerbitan/PhD. Memerlukan pemetaan konstruk, semakan pakar, kajian rintis, penilaian kebolehpercayaan dan kesahan jika digunakan untuk pengujian konstruk. Data simulasi dijana secara rawak bersyarat untuk demonstrasi sahaja; tidak boleh dijadikan bukti hubungan empirikal, kadar rasmi, atau untuk inferensi sebenar. Pemberitahuan privasi dan proses persetujuan hendaklah disesuaikan dengan kelulusan etika sebenar.
