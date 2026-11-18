# Sinkronisasi TeacherFlow dengan Firebase (gratis, paket Spark)

1. Buka https://console.firebase.google.com, buat project (atau pakai project yang sudah ada).
2. Build > Authentication > Get started > Sign-in method > aktifkan **Google**.
3. Authentication > Settings > **Authorized domains** > tambahkan domain tempat TeacherFlow di-deploy (mis. teacherflow.vercel.app atau domain Anda). `localhost` sudah ada.
4. Build > Firestore Database > Create database (mode production, lokasi terdekat, mis. asia-southeast2).
5. Firestore > tab **Rules** > tempel isi file `firestore.rules` > Publish.
6. Project settings > Your apps > tambah **Web app** > salin objek `firebaseConfig`.
7. Buka TeacherFlow > ikon awan / Pengaturan > tempel `firebaseConfig` > Simpan konfigurasi > **Masuk dengan Google**.
   (Atau tempel langsung ke konstanta `TF_FIREBASE` di dalam index.html agar semua perangkat otomatis memakainya.)

Cara kerja: data tetap disimpan lokal lebih dulu (bisa dipakai offline), lalu diunggah ke
`users/{uid}/teacherflow/data`. Perubahan dari perangkat lain masuk otomatis; jika terjadi
perbedaan, data yang paling baru diubah yang dipakai.
Catatan: login Google tidak berjalan jika index.html dibuka langsung dari file (file://); gunakan HTTPS/Vercel atau localhost.

---
# Memasang & memakai offline

- Deploy folder ini apa adanya ke Vercel / Cloudflare Pages / GitHub Pages (wajib HTTPS). Semua aset sudah lokal, tidak ada CDN.
- Buka sekali saat online. Setelah itu seluruh aplikasi tersimpan di perangkat dan jalan tanpa internet.
- Android / laptop (Chrome, Edge): tombol **Pasang** muncul di header, atau pakai ikon pasang di address bar.
- iPhone / iPad: buka di Safari > Bagikan > **Tambah ke Layar Utama**.
- Setiap kali Anda deploy versi baru, pengguna menerima pembaruan otomatis pada kunjungan berikutnya.
