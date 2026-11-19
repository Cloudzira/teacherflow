# TeacherFlow

Agenda & pengingat guru terpadu. Aplikasi web statis (PWA): tanpa server, tanpa langkah build.
Data tersimpan di perangkat (`localStorage`), bisa dipakai offline, dan sinkronisasi Firebase bersifat opsional
(lihat `SETUP-FIREBASE.md`).

## Menjalankan
Sajikan folder ini lewat server statis apa pun (service worker butuh `http(s)`), misalnya:

```bash
python3 -m http.server 8080      # lalu buka http://localhost:8080
```

Untuk publikasi, unggah seluruh folder ke GitHub Pages / Netlify / hosting statis lain.

## Struktur kode
Berkas `js/` dimuat berurutan oleh `index.html` sebagai skrip biasa (berbagi lingkup global).
**Urutan pemuatan penting**; jangan diubah tanpa menguji.

| Berkas | Isi |
|---|---|
| `js/holidays.js` | Data libur nasional + cuti bersama 2026–2027 (SKB 3 Menteri). Edit di sini. |
| `js/logic.js` | Logika murni tanpa DOM: kejadian agenda, bentrok jadwal, kalender akademik, data lembar ekspor. |
| `js/xlsx.js` | Penulis `.xlsx` tanpa pustaka (CRC32, zip, XML spreadsheet). Murni. |
| `js/tasks-notes.js` | Tugas, catatan, dan modal dasar (kode awal). |
| `js/core.js` | Konstanta UI, penyimpanan, tema, waktu, jam pelajaran. |
| `js/schedule.js` | Kartu fokus, beranda, timeline, jadwal pekan, toast, pengingat, statistik. |
| `js/dialogs.js` | Dialog: konfirmasi, kalender akademik, panduan, onboarding, pengaturan, PWA. |
| `js/sync.js` | Sinkronisasi Firebase (opsional). |
| `js/extras.js` | Footer, bentrok, motivasi, inisialisasi, kalender. |
| `js/export.js` | Dialog ekspor: Excel dan cetak/PDF. |

`logic.js`, `xlsx.js`, dan `holidays.js` tidak menyentuh DOM sehingga bisa diuji di Node.

## Tes
Tanpa dependensi; cukup Node 20+:

```bash
npm test          # sama dengan: node --test
```

Cakupan: logika agenda & bentrok, kalender akademik (mode libur, rentang tanggal, data lama),
integritas data libur (jumlah sesuai SKB, tanpa duplikat, cuti bersama jatuh di hari kerja),
serta penulis `.xlsx` (vektor CRC-32, struktur zip, kelengkapan bagian OOXML, XML well-formed).

## Memperbarui hari libur
Pemerintah menerbitkan SKB 3 Menteri tiap tahun (dan kadang merevisi). Tambahkan baris pada
`TF_HOLIDAYS_RAW` di `js/holidays.js` dengan format `['YYYY-MM-DD','libur'|'cuti','Nama']`,
lalu jalankan `npm test`: tes akan memeriksa jumlah dan hari-hari yang tidak masuk akal.
Jika menambah tahun baru, tambahkan juga ekspektasi jumlahnya di `tests/holidays.test.js`.

## Setelah mengubah berkas
Naikkan `VERSION` di `sw.js` agar pengguna yang sudah memasang aplikasi menerima pembaruan,
dan tambahkan berkas baru ke daftar `ASSETS` di `sw.js` supaya tersedia offline.
