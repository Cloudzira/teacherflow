/* Hari libur nasional & cuti bersama Indonesia.
   Sumber: SKB 3 Menteri (Agama, Ketenagakerjaan, PANRB)
     - Tahun 2026: SKB No. 1497/2025, No. 2/2025, No. 5/2025 (ditetapkan 19 September 2025)
     - Tahun 2027: SKB No. 1205/2026, No. 3/2026, No. 2/2026 (ditetapkan 15 September 2026)
   Catatan: tanggal Idulfitri dan Iduladha dapat disesuaikan lewat Keputusan Menteri Agama.
   Jika pemerintah merevisi, ubah daftar di bawah ini. Format: [tanggal, jenis, nama]
   jenis: 'libur' = hari libur nasional, 'cuti' = cuti bersama. */
const TF_HOLIDAYS_RAW=[
  // ---- 2026 (17 libur nasional + 8 cuti bersama) ----
  ['2026-01-01','libur','Tahun Baru 2026 Masehi'],
  ['2026-01-16','libur','Isra Mikraj Nabi Muhammad SAW'],
  ['2026-02-16','cuti','Cuti Bersama Tahun Baru Imlek 2577'],
  ['2026-02-17','libur','Tahun Baru Imlek 2577 Kongzili'],
  ['2026-03-18','cuti','Cuti Bersama Hari Suci Nyepi'],
  ['2026-03-19','libur','Hari Suci Nyepi (Tahun Baru Saka 1948)'],
  ['2026-03-20','cuti','Cuti Bersama Idulfitri 1447 H'],
  ['2026-03-21','libur','Idulfitri 1447 Hijriah'],
  ['2026-03-22','libur','Idulfitri 1447 Hijriah'],
  ['2026-03-23','cuti','Cuti Bersama Idulfitri 1447 H'],
  ['2026-03-24','cuti','Cuti Bersama Idulfitri 1447 H'],
  ['2026-04-03','libur','Wafat Yesus Kristus'],
  ['2026-04-05','libur','Kebangkitan Yesus Kristus (Paskah)'],
  ['2026-05-01','libur','Hari Buruh Internasional'],
  ['2026-05-14','libur','Kenaikan Yesus Kristus'],
  ['2026-05-15','cuti','Cuti Bersama Kenaikan Yesus Kristus'],
  ['2026-05-27','libur','Iduladha 1447 Hijriah'],
  ['2026-05-28','cuti','Cuti Bersama Iduladha 1447 H'],
  ['2026-05-31','libur','Hari Raya Waisak 2570 BE'],
  ['2026-06-01','libur','Hari Lahir Pancasila'],
  ['2026-06-16','libur','Tahun Baru Islam 1448 Hijriah'],
  ['2026-08-17','libur','Proklamasi Kemerdekaan RI'],
  ['2026-08-25','libur','Maulid Nabi Muhammad SAW'],
  ['2026-12-24','cuti','Cuti Bersama Natal'],
  ['2026-12-25','libur','Kelahiran Yesus Kristus (Natal)'],
  // ---- 2027 (18 libur nasional + 8 cuti bersama) ----
  ['2027-01-01','libur','Tahun Baru 2027 Masehi'],
  ['2027-01-05','libur','Isra Mikraj Nabi Muhammad SAW 1448 H'],
  ['2027-02-05','cuti','Cuti Bersama Tahun Baru Imlek 2578'],
  ['2027-02-06','libur','Tahun Baru Imlek 2578 Kongzili'],
  ['2027-03-08','libur','Hari Suci Nyepi (Tahun Baru Saka 1949)'],
  ['2027-03-09','cuti','Cuti Bersama Idulfitri 1448 H'],
  ['2027-03-10','libur','Idulfitri 1448 Hijriah'],
  ['2027-03-11','libur','Idulfitri 1448 Hijriah'],
  ['2027-03-12','cuti','Cuti Bersama Idulfitri 1448 H'],
  ['2027-03-15','cuti','Cuti Bersama Idulfitri 1448 H'],
  ['2027-03-25','cuti','Cuti Bersama Wafat Yesus Kristus'],
  ['2027-03-26','libur','Wafat Yesus Kristus'],
  ['2027-03-28','libur','Kebangkitan Yesus Kristus (Paskah)'],
  ['2027-05-01','libur','Hari Buruh Internasional'],
  ['2027-05-06','libur','Kenaikan Yesus Kristus'],
  ['2027-05-17','libur','Iduladha 1448 Hijriah'],
  ['2027-05-18','cuti','Cuti Bersama Iduladha 1448 H'],
  ['2027-05-19','cuti','Cuti Bersama Hari Raya Waisak'],
  ['2027-05-20','libur','Hari Raya Waisak 2571 BE'],
  ['2027-06-01','libur','Hari Lahir Pancasila'],
  ['2027-06-06','libur','Tahun Baru Islam 1449 Hijriah'],
  ['2027-08-15','libur','Maulid Nabi Muhammad SAW'],
  ['2027-08-17','libur','Proklamasi Kemerdekaan RI'],
  ['2027-12-24','cuti','Cuti Bersama Natal'],
  ['2027-12-25','libur','Kelahiran Yesus Kristus (Natal)'],
  ['2027-12-26','libur','Isra Mikraj Nabi Muhammad SAW 1449 H']
];
const TF_HOLIDAYS=Object.fromEntries(TF_HOLIDAYS_RAW.map(([d,t,n])=>[d,{t,n}]));
