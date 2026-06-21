// ============================================================
//  TAMBAHAN KODE ARDUINO - Kirim Data ke Website Monitoring
//  Sisipkan kode ini ke program alat yang sudah ada
//  (Rista Putri - Fermentasi Tempe)
// ============================================================

// ===== STEP 1: Tambahkan library ini di bagian atas (setelah include yang ada) =====
#include <HTTPClient.h>

// ===== STEP 2: Ganti dengan IP komputer/server kamu =====
// Cara cari IP: buka CMD > ketik ipconfig > lihat "IPv4 Address"
// Contoh: 192.168.1.100
const char* serverURL     = "http://192.168.1.100:3000/api/data";  // data realtime
const char* serverLogURL  = "http://192.168.1.100:3000/api/log";   // log 4 jam

// ===== STEP 3: Tambahkan variabel timer log 4 jam =====
unsigned long lastLogMillis = 0;
const long LOG_INTERVAL = 4UL * 60UL * 60UL * 1000UL;  // 4 jam dalam ms (14.400.000 ms)
// Untuk testing, bisa pakai 60000 (1 menit) dulu, lalu ganti ke 14400000

// ===== STEP 4: Fungsi kirim ke website =====
void sendToWebsite(float temperature, float humidity, float nh3val, bool isLog) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi tidak terhubung, skip kirim website");
    return;
  }

  HTTPClient http;
  String url = isLog ? serverLogURL : serverURL;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Buat JSON payload
  String payload = "{";
  payload += "\"suhu\":" + String(temperature, 2) + ",";
  payload += "\"kelembaban\":" + String(humidity, 2) + ",";
  payload += "\"nh3\":" + String(nh3val, 2);
  payload += "}";

  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    if (isLog) {
      Serial.println("[HTTP] LOG 4 jam berhasil dikirim ke website ✓");
    } else {
      Serial.println("[HTTP] Data realtime berhasil dikirim ✓");
    }
  } else {
    Serial.print("[HTTP] Gagal kirim. Kode: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ===== STEP 5: Di dalam loop(), setelah sendDataToBlynk(), tambahkan ini: =====
/*
    // Kirim ke website (setiap pembacaan ~2 detik)
    sendToWebsite(temperature, humidity, nh3ppm, false);

    // Kirim LOG setiap 4 jam
    if (currentMillis - lastLogMillis >= LOG_INTERVAL || lastLogMillis == 0) {
      lastLogMillis = currentMillis;
      sendToWebsite(temperature, humidity, nh3ppm, true);
      Serial.println(">>> LOG 4 JAM DIKIRIM <<<");
    }
*/

// ============================================================
//  CARA PAKAI:
//  1. Salin kode di atas ke file Arduino yang sudah ada
//  2. Ganti IP di serverURL dengan IP komputer kamu
//  3. Sisipkan kode di STEP 5 ke dalam loop() setelah sendDataToBlynk()
//  4. Upload ke ESP32
// ============================================================
