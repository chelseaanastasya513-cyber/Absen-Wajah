# Absensi Wajah

Aplikasi absensi wajah sederhana menggunakan HTML, CSS, dan JavaScript murni.

## Fitur

- Input nama mahasiswa
- Aktifkan kamera webcam
- Preview kamera
- Ambil foto wajah
- Absen masuk dengan data nama, tanggal, jam, foto base64
- Mengirim data ke Google Spreadsheet melalui Google Apps Script
- Notifikasi absensi berhasil
- Desain biru-putih modern dan responsive

## Cara Pakai

1. Buka `index.html` di browser.
2. Masukkan nama mahasiswa.
3. Klik `Aktifkan Kamera` dan izinkan akses kamera.
4. Klik `Ambil Foto`.
5. Klik `Absen Masuk`.

## Konfigurasi Google Apps Script

1. Buat script Google Apps Script yang menerima POST JSON.
2. Ganti nilai `GAS_URL` di `script.js` dengan URL deploy Apps Script Anda.
