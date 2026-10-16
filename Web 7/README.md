# RuangKita — portal kampus latihan

Portal kampus fiktif dengan antarmuka bernuansa hangat seperti halaman dukungan kreator, dibuat khusus untuk latihan aplikasi web. Seluruh nama, alamat email, nilai, mata kuliah, dan identitas di sini sintetis.

## Menjalankan

Buka `index.html` di browser modern. Tidak perlu instalasi atau server. Data perubahan disimpan di browser yang sedang digunakan:

- `localStorage`: akun, nilai, tugas, dan diskusi.
- `IndexedDB`: isi berkas tugas yang diunggah (maks. 10 MB per berkas).

Pilih akun demo di halaman masuk. Kata sandi semua akun adalah `awan-demo`.

| Peran | Email |
| --- | --- |
| Mahasiswa — Nara Putri | `nara.putri@awan.test` |
| Mahasiswa — Bima Adikara | `bima.adikara@awan.test` |
| Dosen — Dr. Saka Wibowo | `saka.wibowo@awan.test` |
| Admin — Laras Mahendra | `laras.admin@awan.test` |

Fitur demo: melihat nilai dan tugas, mengunggah/mengunduh berkas di browser, berdiskusi, memberi nilai, dan mengelola akun sintetis.

## Kerentanan latihan yang disengaja

> **Jangan deploy aplikasi rentan ini ke internet atau gunakan data/akun nyata.** Ini prototipe sisi-klien untuk latihan lokal; tidak ada server, basis data nyata, ataupun autentikasi yang aman. Reset demo dengan menghapus data situs/local storage browser.

1. **IDOR / kontrol akses lemah — nilai mahasiswa**
   - Masuk sebagai Nara dan buka menu **Nilai akademik**.
   - Ubah URL browser dengan menambahkan `?student=mhs-24086` (atau `?student=mhs-24071`), lalu buka menu **Nilai akademik** lagi jika halaman kembali ke Beranda.
   - Nilai milik akun lain ditampilkan karena parameter identitas dipercaya tanpa otorisasi. Data tampilan tetap sintetis.
2. **Stored XSS — ruang diskusi**
   - Masuk sebagai mahasiswa, buka **Ruang diskusi**, lalu buat post dengan markup uji seperti `<strong>uji format</strong>`.
   - Post disimpan di `localStorage` lalu dimasukkan ke halaman sebagai HTML tanpa encoding. Untuk memeriksa eksekusi event handler pada browser lokal, gunakan hanya payload aman yang menulis penanda ke konsol, misalnya `<img src=x onerror="console.log('demo-xss')">`.
   - Muat ulang halaman untuk melihat bahwa post tersimpan dan dirender lagi. Hapus data situs setelah latihan.

Kedua celah di atas sengaja dibiarkan untuk praktik dan bukan pola yang aman untuk aplikasi produksi.
