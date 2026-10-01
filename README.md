# 🦉 Cora Kids - Dylexi (Sahabat Pintar Anak)

Implementasi desain antarmuka Figma **Cora Kids - Dylexi** ke dalam aplikasi web interaktif berbasis **Python** dengan fitur aksesibilitas khusus anak dengan disleksia (*dyslexia-friendly*).

---

## 🌟 5 Layar Utama yang Diimplementasikan Sesuai Figma

1. **🏠 Beranda Belajar (`Cora Kids - Beranda`)**
   - Header status aktif, streak belajar 3 hari (`🔥 3 Hari`), koin belajar (`🪙 240 Koin`).
   - Hero banner interaktif: *"Halo, Reya! Siap Berpetualang Ceria? 🚀"* dengan bilah progres misi harian (2/3 selesai) dan kartu audio Cora.
   - Kartu Misi Utama Lanjutan: *"Petualangan Huruf Kembar: Membedakan Huruf 'b' dan 'd' 🎈"*.
   - 3 Kartu Wahana Bebas Tekanan:
     - 🎵 *Tebak Bunyi & Kata* (Permainan fonetik interaktif).
     - ✍️ *Jejak Pasir Ajaib* (Latihan sensori visual).
     - 🍎 *Panen Buah Ceria* (Mini-game memetik buah berhuruf).
   - Widget Percakapan Cepat Cora AI & Lemari Hadiah Harian.

2. **✍️ Ruang Belajar (`Cora Kids - Ruang Belajar`)**
   - **Kanvas Interaktif Menulis Huruf 'b' dan 'd'** dengan panduan titik nomor langkah (1 ➔ 2 ➔ 3).
   - Toolbar menggambar: Kuas Ajaib 🖌️, Pensil Lembut ✏️, Spidol Pelangi 🌈, dan Penghapus Awan ☁️.
   - Pilihan warna cerah dan palet ramah anak.
   - Tombol *Pandu Suara Huruf* (TTS otomatis membacakan petunjuk langkah goresan).
   - Evaluasi goresan dan pemberian bintang emas & koin.

3. **📚 Modul Belajar & Cerita (`Cora Kids - Modul Belajar`)**
   - Katalog 6 modul cerita petualangan bergambar:
     1. *Jejak Huruf 'b' & 'd'*
     2. *Kereta Kata & Sahabat Hewan*
     3. *Tantangan Jejak Berbintang*
     4. *Pasar Buah Riang Gembira*
     5. *Lorong Gelembung Rahasia*
     6. *Konser Nyanyian Rimba*
   - Modal Pembaca Cerita Interaktif lengkap dengan tombol narasi suara Cora.

4. **🏆 Lemari Penghargaan & Prestasi (`Cora Kids - Piala & Pencapaian`)**
   - Banner Zamrud Penghargaan dengan ucapan selamat langsung dari Cora.
   - Rak 4 Lencana Prestasi (Penakluk Huruf Kembar, Detektif Suara, dsb.).
   - **Album Stiker Hewan Sahabat**: Stiker interaktif yang mengeluarkan suara perkenalan saat diklik (Burung Hantu Cora, Rubah Cerdik, Beruang Manis, Kelinci Ceria).

5. **🌟 Taman Belajar AI Cora (`Html -> Body`)**
   - Karakter Maskot Cora AI interaktif dengan animasi berdenyut saat berbicara.
   - Indikator gelombang audio (*animated audio waveform*).
   - Tombol Rekam Suara: **"🎙️ TEKAN & BICARA PADA CORA"** menggunakan Web Speech API (*Speech-to-Text*).
   - Obrolan chat interaktif dengan respons pedagogis ramah anak untuk membantu membedakan huruf kembar dan menenangkan kecemasan belajar.

---

## ♿ Fitur Khusus Ramah Disleksia (Accessibility)

- **Tipografi Lexend**: Font berbobot lebih tebal di bagian bawah huruf untuk mencegah rotasi dan pembalikan huruf (mencegah tertukarnya b-d-p-q).
- **Spasi Lega**: Huruf dan kata diberi spasi renggang untuk mengurangi beban membaca visual (*visual crowding*).
- **Warna Lembut Bebas Silau (Irlen Tinting)**: Latar belakang krem pastel lembut (`#FBF8EE`) yang mengurangi kontras tajam penyebab kelelahan mata.
- **Dukungan Audio Penuh (TTS)**: Setiap tombol, modul, dan instruksi dapat didengarkan suaranya.

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menggunakan Python (Direkomendasikan)
Buka terminal di folder proyek ini dan jalankan:
```bash
python server.py
```
Atau di Windows, cukup **klik ganda file `run.bat`**.

Aplikasi akan otomatis berjalan di browser:
👉 **http://localhost:8080**

### Opsi 2: Menggunakan Java
Jika JDK terpasang di komputer:
```bash
javac Server.java
java Server
```
Lalu buka `http://localhost:8080` di browser Anda.
