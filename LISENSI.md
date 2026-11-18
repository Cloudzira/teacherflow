# Mengaktifkan Premium untuk pembeli (manual)

Gratis = Beranda dan Jadwal (offline, tanpa login).
Premium = semua fitur: Tugas, Kalender & Catatan, Pengaturan, pengingat/notifikasi, dan sinkronisasi antar perangkat.

## Sekali di awal
1. Firebase Console > Firestore Database > tab **Rules** > tempel isi `firestore.rules` > **Publish**.
2. Di `index.html` isi dua konstanta (cari `TF_BUY_URL`):
   - `TF_BUY_URL` = tautan produk Lynk.id Anda
   - `TF_WA` = nomor WhatsApp admin, mis. `6281234567890`
3. Deploy ulang.

## Setiap ada pembeli baru
1. Lihat email Google pembeli (dari isian di Lynk.id / WhatsApp).
2. Firebase Console > Firestore Database > **Start collection** (pertama kali) atau buka koleksi `licenses`.
3. **Add document**
   - Document ID: email pembeli, **HURUF KECIL semua**, mis. `guru.budi@gmail.com`
   - Field: `aktifSampai`, tipe **timestamp**, isi tanggal berakhir (mis. 1 tahun dari hari ini)
4. Beri tahu pembeli: buka app > Pengaturan > Sinkronisasi > **Saya sudah bayar, cek status**.

## Perpanjang / cabut
- Perpanjang: ubah `aktifSampai` ke tanggal baru.
- Cabut: hapus dokumennya (atau set tanggal ke masa lalu).
- Saat Premium berakhir, app kembali ke mode gratis (Beranda & Jadwal). Data tugas/catatan tetap tersimpan di perangkat dan muncul lagi setelah diperpanjang. Data cloud tetap bisa dibaca/dihapus pemiliknya; hanya unggah yang berhenti.

## Catatan
- Penguncian fitur (Tugas, Kalender, Pengaturan, notifikasi) dilakukan di app, jadi pengguna yang paham teknis bisa mengakalinya. Hanya sinkronisasi cloud yang dijaga server lewat aturan Firestore.
- Setiap penulisan data memicu satu pembacaan tambahan untuk memeriksa lisensi (tetap kecil di paket gratis).
- Email harus sama persis dengan akun Google yang dipakai login.
