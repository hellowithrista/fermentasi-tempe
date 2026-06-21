# 🫘 Website Monitoring Fermentasi Tempe
**Rista Putri - 062330701431 - DIII Teknik Komputer POLSRI 2026**

---

## 📋 Apa Saja yang Ada di Sini

```
fermentasi-monitor/
├── server.js              ← Backend API + database
├── package.json           ← Daftar library Node.js
├── fermentasi.db          ← Database SQLite (dibuat otomatis)
├── public/
│   └── index.html         ← Tampilan website
└── ARDUINO_TAMBAHAN.ino   ← Kode tambahan untuk ESP32
```

---

## 🖥️ LANGKAH 1 - Install Node.js di Komputer

1. Download Node.js dari https://nodejs.org (pilih LTS)
2. Install seperti biasa (next-next-finish)
3. Buka CMD/Terminal, ketik `node --version` → harus muncul nomor versi

---

## 📦 LANGKAH 2 - Jalankan Server

Buka CMD di folder `fermentasi-monitor`, lalu ketik:

```bash
npm install
node server.js
```

Kalau sukses akan muncul:
```
===================================
  Server Monitoring Fermentasi Tempe
  Berjalan di: http://localhost:3000
===================================
```

Buka browser → `http://localhost:3000` → website sudah jalan!

---

## 🔌 LANGKAH 3 - Cari IP Komputer Kamu

Komputer dan ESP32 harus terhubung ke WiFi yang sama ("Rista").

**Di Windows:**
1. Buka CMD
2. Ketik: `ipconfig`
3. Cari "IPv4 Address" → contoh: `192.168.1.100`

**Di Mac/Linux:**
```bash
ifconfig | grep "inet "
```

---

## ⚡ LANGKAH 4 - Edit Kode Arduino

Buka file `ARDUINO_TAMBAHAN.ino`, copy semua kode ke program Arduino kamu.

**Ganti IP ini:**
```cpp
const char* serverURL    = "http://192.168.1.100:3000/api/data";
const char* serverLogURL = "http://192.168.1.100:3000/api/log";
```
→ Ganti `192.168.1.100` dengan IP komputer kamu dari langkah 3.

**Di dalam `loop()`, setelah baris `sendDataToBlynk(temperature, humidity);` tambahkan:**
```cpp
// Kirim ke website (setiap pembacaan)
sendToWebsite(temperature, humidity, nh3ppm, false);

// Log setiap 4 jam
if (currentMillis - lastLogMillis >= LOG_INTERVAL || lastLogMillis == 0) {
  lastLogMillis = currentMillis;
  sendToWebsite(temperature, humidity, nh3ppm, true);
  Serial.println(">>> LOG 4 JAM DIKIRIM <<<");
}
```

Upload ke ESP32.

---

## 🌐 Akses Website dari HP/Tablet

Selama HP terhubung ke WiFi yang sama, buka browser dan ketik:
```
http://192.168.1.100:3000
```
(ganti dengan IP komputer kamu)

---

## 📡 API Endpoint (untuk referensi)

| Method | URL | Fungsi |
|--------|-----|--------|
| POST | `/api/data` | Terima data realtime dari ESP32 |
| POST | `/api/log` | Terima log 4 jam dari ESP32 |
| GET | `/api/latest` | Data sensor terbaru |
| GET | `/api/history` | 50 data terakhir (untuk grafik) |
| GET | `/api/logs` | Semua log 4 jam |
| GET | `/api/stats` | Statistik rata-rata/min/max |

---

## 🔧 Troubleshooting

**Website tidak bisa dibuka?**
- Pastikan sudah jalankan `node server.js`
- Cek firewall Windows: izinkan Node.js

**ESP32 tidak bisa kirim data?**
- Pastikan IP benar
- ESP32 dan komputer harus di WiFi yang sama
- Cek di Serial Monitor Arduino apakah ada pesan error HTTP

**Data tidak muncul di website?**
- Buka CMD yang menjalankan server → lihat apakah ada log masuk
- Test manual: buka Postman atau browser ketik `http://localhost:3000/api/latest`

---

## ⚙️ Batas Normal Parameter

| Parameter | Min | Max | Satuan |
|-----------|-----|-----|--------|
| Suhu | 30 | 35 | °C |
| Kelembaban | 60 | 80 | % RH |
| NH₃ (aman) | 0 | 50 | ppm |
