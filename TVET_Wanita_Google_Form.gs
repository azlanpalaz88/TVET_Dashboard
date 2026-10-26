
function createTVETWomenForm() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('TVET_FORM_ID');

  if (saved) {
    const old = FormApp.openById(saved);
    Logger.log('Borang sedia ada: ' + old.getEditUrl());
    Logger.log('Pautan responden: ' + old.getPublishedUrl());
    return;
  }

  const form = FormApp.create(
    'Soal Selidik Kebolehpasaran Graduan Wanita TVET (Draf)'
  );

  form.setDescription(
    'Kajian ini bertujuan meneliti profil, status pekerjaan, ' +
    'kemahiran dan cabaran kebolehpasaran graduan wanita TVET. ' +
    'Penyertaan adalah sukarela. Tiada nama atau nombor ' +
    'pengenalan diminta. Sebelum edaran sebenar, lengkapkan ' +
    'notis penyelidikan, maklumat pengkaji dan kelulusan etika.'
  );

  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setConfirmationMessage(
    'Terima kasih atas maklum balas anda.'
  );
  form.setShowLinkToRespondAgain(false);

  // Fungsi membantu pembinaan soalan
  function choice(id, question, options, required = true) {
    return form.addMultipleChoiceItem()
      .setTitle('[' + id + '] ' + question)
      .setChoiceValues(options)
      .setRequired(required);
  }

  function dropdown(id, question, options) {
    return form.addListItem()
      .setTitle('[' + id + '] ' + question)
      .setChoiceValues(options)
      .setRequired(true);
  }

  function scale(id, question) {
    return form.addScaleItem()
      .setTitle('[' + id + '] ' + question)
      .setBounds(1, 5)
      .setLabels('Sangat tidak setuju', 'Sangat setuju')
      .setRequired(true);
  }

  // A. PERSETUJUAN DAN KELAYAKAN
  form.addSectionHeaderItem()
    .setTitle('A. Persetujuan kajian');

  const consent = choice(
    'consent',
    'Saya bersetuju untuk mengambil bahagian.',
    ['Ya, saya bersetuju', 'Tidak, saya tidak bersetuju']
  );

  const eligiblePage = form.addPageBreakItem()
    .setTitle('A2. Kelayakan responden');

  const eligible = choice(
    'eligible',
    'Adakah anda graduan wanita yang telah menamatkan program TVET?',
    ['Ya', 'Tidak']
  );

  // B. PROFIL GRADUAN
  const profile = form.addPageBreakItem()
    .setTitle('B. Profil graduan');

  choice('age_group', 'Kumpulan umur anda', [
    '18–20 tahun', '21–24 tahun', '25–29 tahun',
    '30–34 tahun', '35 tahun dan ke atas'
  ]);

  dropdown('state', 'Negeri tempat tinggal semasa', [
    'Pulau Pinang', 'Kedah', 'Perak', 'Selangor',
    'Kuala Lumpur', 'Johor', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Terengganu', 'Kelantan', 'Perlis',
    'Sabah', 'Sarawak', 'Putrajaya', 'Labuan'
  ]);

  dropdown('institution_type', 'Jenis institusi TVET', [
    'Politeknik', 'Kolej Komuniti', 'ILP / ADTEC',
    'IKM / KKTM', 'Kolej Vokasional',
    'Institusi TVET Swasta'
  ]);

  choice('qualification', 'Kelayakan TVET tertinggi', [
    'Sijil TVET', 'Diploma TVET', 'Diploma Lanjutan TVET'
  ]);

  dropdown('programme', 'Bidang utama pengajian TVET', [
    'Teknologi Maklumat & Digital',
    'Elektrik & Elektronik',
    'Automotif',
    'Hospitaliti & Pelancongan',
    'Kulinari & Bakeri',
    'Fesyen & Rekaan',
    'Mekatronik & Pembuatan',
    'Perniagaan & Pengurusan',
    'Pembinaan & Seni Bina'
  ]);

  dropdown('graduation_year', 'Tahun tamat pengajian TVET', [
    '2021', '2022', '2023', '2024', '2025', '2026'
  ]);

  choice('internship', 'Adakah anda mengikuti latihan industri?', [
    'Ya', 'Tidak'
  ]);

  choice('internship_duration', 'Tempoh latihan industri', [
    'Tiada', '1–3 bulan', '4–6 bulan', 'Lebih 6 bulan'
  ]);

  choice(
    'career_guidance',
    'Adakah anda menerima bimbingan kerjaya daripada institusi?',
    ['Ya', 'Tidak', 'Tidak pasti']
  );

  // C. STATUS PEKERJAAN
  const statusOptions = [
    'Bekerja sepenuh masa',
    'Bekerja separuh masa',
    'Bekerja sendiri',
    'Tidak bekerja, sedang mencari pekerjaan',
    'Tidak bekerja, tidak sedang mencari pekerjaan',
    'Menyambung pengajian sepenuh masa (tidak bekerja)'
  ];

  const status = choice(
    'employment_status',
    'Status utama anda pada masa ini',
    statusOptions
  );

  // D1. GRADUAN BEKERJA
  const workingPage = form.addPageBreakItem()
    .setTitle('C. Maklumat pekerjaan (bekerja)');

  choice('employment_sector', 'Sektor pekerjaan', [
    'Swasta', 'Kerajaan', 'NGO / organisasi sosial',
    'Perniagaan sendiri', 'Lain-lain'
  ]);

  choice('employment_type', 'Jenis pekerjaan semasa', [
    'Tetap', 'Kontrak', 'Sambilan', 'Bekerja sendiri'
  ]);

  choice('job_match', 'Kesepadanan pekerjaan dengan bidang TVET', [
    'Sepadan', 'Sebahagiannya sepadan', 'Tidak sepadan'
  ]);

  const income = form.addTextItem()
    .setTitle(
      '[monthly_income_rm] Anggaran pendapatan kerja bulanan (RM)'
    )
    .setRequired(false);

  income.setValidation(
    FormApp.createTextValidation()
      .setHelpText('Masukkan nombor melebihi 0, tanpa simbol RM.')
      .requireNumberGreaterThan(0)
      .build()
  );

  choice(
    'first_job_delay',
    'Tempoh memperoleh pekerjaan pertama selepas tamat TVET',
    [
      'Sebelum tamat pengajian',
      'Kurang 1 bulan',
      '1–3 bulan',
      '4–6 bulan',
      '7–12 bulan',
      'Lebih 12 bulan'
    ]
  );

  // D2. GRADUAN BELUM BEKERJA
  const notWorkingPage = form.addPageBreakItem()
    .setTitle('D. Maklumat graduan belum bekerja');

  choice(
    'job_search_duration',
    'Tempoh mencari pekerjaan selepas tamat pengajian',
    [
      'Tidak mencari pekerjaan',
      'Kurang 1 bulan',
      '1–3 bulan',
      '4–6 bulan',
      '7–12 bulan',
      'Lebih 12 bulan'
    ]
  );

  choice('nonemployment_reason', 'Sebab utama anda belum bekerja', [
    'Belum menerima tawaran yang sesuai',
    'Sedang menyambung pengajian',
    'Belum memulakan pencarian kerja',
    'Komitmen keluarga / peribadi',
    'Lokasi atau pengangkutan',
    'Lain-lain'
  ]);

  // E. KEMAHIRAN DAN KESEDIAAN KERJAYA
  const skillsPage = form.addPageBreakItem()
    .setTitle('E. Kemahiran dan kesediaan kerjaya');

  form.addSectionHeaderItem()
    .setTitle('Skala 1 hingga 5')
    .setHelpText(
      '1 = Sangat tidak setuju; 2 = Tidak setuju; ' +
      '3 = Neutral; 4 = Setuju; 5 = Sangat setuju.'
    );

  const skills = [
    'Saya menguasai kemahiran teknikal yang diperlukan dalam bidang TVET saya.',
    'Saya boleh menggunakan peralatan atau teknologi khusus dalam bidang latihan saya.',
    'Saya mampu menyelesaikan masalah teknikal berdasarkan latihan yang saya terima.',
    'Saya boleh berkomunikasi dengan jelas dalam suasana pekerjaan.',
    'Saya boleh bekerjasama dalam pasukan yang mempunyai latar belakang berbeza.',
    'Saya boleh menyesuaikan diri dengan perubahan tugas dan persekitaran kerja.',
    'Saya mahir menggunakan aplikasi digital yang berkaitan dengan pekerjaan.',
    'Saya mampu mempelajari penggunaan teknologi baharu untuk pekerjaan.',
    'Saya boleh menggunakan alat digital untuk menyelesaikan tugasan kerja.',
    'Saya yakin dengan kemampuan saya menghadiri temu duga pekerjaan.',
    'Saya memahami jangkaan majikan dalam bidang kerjaya pilihan saya.',
    'Saya bersedia mengambil peluang kerjaya yang sepadan dengan kelayakan saya.',
    'Institusi TVET saya menyediakan maklumat peluang pekerjaan yang berguna.',
    'Pembelajaran di institusi membantu saya memahami tuntutan pekerjaan sebenar.',
    'Saya menerima bimbingan yang membantu persediaan kerjaya saya.'
  ];

  skills.forEach((question, index) => {
    scale('S' + String(index + 1).padStart(2, '0'), question);
  });

  // F. CABARAN KEBOLEHPASARAN
  form.addPageBreakItem()
    .setTitle('F. Cabaran kebolehpasaran');

  const barriers = [
    'Saya pernah berdepan stereotaip gender semasa mencari peluang pekerjaan dalam bidang TVET.',
    'Kekangan lokasi atau pengangkutan mengehadkan pilihan pekerjaan saya.',
    'Tanggungjawab keluarga atau penjagaan mengehadkan pilihan pekerjaan saya.'
  ];

  barriers.forEach((question, index) => {
    choice('B0' + (index + 1), question, [
      '1', '2', '3', '4', '5', 'Tidak berkenaan'
    ]).setHelpText(
      '1 = Sangat tidak setuju; 5 = Sangat setuju; ' +
      'pilih Tidak berkenaan jika sesuai.'
    );
  });

  choice(
    'main_barrier',
    'Halangan utama yang paling menjejaskan peluang pekerjaan anda',
    [
      'Peluang kerja dalam bidang terhad',
      'Gaji ditawarkan tidak memadai',
      'Majikan memerlukan pengalaman kerja',
      'Kekangan lokasi / pengangkutan',
      'Stereotaip gender',
      'Komitmen keluarga / penjagaan',
      'Tidak menghadapi halangan utama',
      'Lain-lain'
    ]
  );

  // LOGIK PERCABANGAN SOALAN
  consent.setChoices([
    consent.createChoice(
      'Ya, saya bersetuju', eligiblePage
    ),
    consent.createChoice(
      'Tidak, saya tidak bersetuju',
      FormApp.PageNavigationType.SUBMIT
    )
  ]);

  eligible.setChoices([
    eligible.createChoice('Ya', profile),
    eligible.createChoice(
      'Tidak', FormApp.PageNavigationType.SUBMIT
    )
  ]);

  status.setChoices(
    statusOptions.map((option, i) =>
      status.createChoice(
        option,
        i < 3 ? workingPage : notWorkingPage
      )
    )
  );

  // Responden bekerja melangkau seksyen belum bekerja.
  notWorkingPage.setGoToPage(skillsPage);

  // SAMBUNGKAN DENGAN GOOGLE SHEETS
  const ss = SpreadsheetApp.create(
    'Respons TVET Graduan Wanita'
  );

  form.setDestination(
    FormApp.DestinationType.SPREADSHEET,
    ss.getId()
  );

  if (form.supportsAdvancedResponderPermissions()) {
    form.setPublished(true);
  }

  form.setAcceptingResponses(true);

  props.setProperty('TVET_FORM_ID', form.getId());
  props.setProperty('TVET_SHEET_ID', ss.getId());

  Logger.log('PAUTAN EDIT BORANG: ' + form.getEditUrl());
  Logger.log('PAUTAN UNTUK RESPONDEN: ' + form.getPublishedUrl());
  Logger.log('GOOGLE SHEETS RESPONS: ' + ss.getUrl());
}

/**
 * Titik akhir CSV untuk sambungan auto-kemas kini dashboard.
 * Selepas menjalankan createTVETWomenForm, deploy skrip sebagai Web App.
 * Gunakan akses yang mematuhi kelulusan etika; akses awam hanya untuk data demo anonim.
 */
function doGet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('TVET_SHEET_ID');
  if (!sheetId) {
    return ContentService.createTextOutput('Google Sheet belum dicipta.');
  }
  const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
  const rows = sheet.getDataRange().getDisplayValues();
  const csv = rows.map(function(row) {
    return row.map(function(value) {
      return '"' + String(value).replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\n');
  return ContentService.createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV);
}
