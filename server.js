const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== DATABASE SUPABASE ====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LSmV26PoaFGIyNsA@db.jrfilhvuademsuhgnebg.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// Buat tabel otomatis kalau belum ada
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        suhu REAL NOT NULL,
        kelembaban REAL NOT NULL,
        nh3 REAL NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS log_data (
        id SERIAL PRIMARY KEY,
        suhu REAL NOT NULL,
        kelembaban REAL NOT NULL,
        nh3 REAL NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Database siap!');
  } catch (err) {
    console.error('Error inisialisasi database:', err.message);
  }
}

// ==================== API ROUTES ====================

// POST /api/data - Terima data realtime dari ESP32
app.post('/api/data', async (req, res) => {
  const { suhu, kelembaban, nh3 } = req.body;

  if (suhu === undefined || kelembaban === undefined || nh3 === undefined) {
    return res.status(400).json({ status: 'error', message: 'Data tidak lengkap' });
  }

  try {
    await pool.query(
      'INSERT INTO sensor_data (suhu, kelembaban, nh3) VALUES ($1, $2, $3)',
      [suhu, kelembaban, nh3]
    );

    // Hapus data lama, simpan 100 terakhir
    await pool.query(`
      DELETE FROM sensor_data WHERE id NOT IN (
        SELECT id FROM sensor_data ORDER BY id DESC LIMIT 100
      )
    `);

    console.log(`Data masuk: Suhu=${suhu}°C, Kelembaban=${kelembaban}%, NH3=${nh3}ppm`);
    res.json({ status: 'ok', message: 'Data berhasil disimpan' });
  } catch (err) {
    console.error('Error simpan data:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/log - Simpan log 4 jam sekali
app.post('/api/log', async (req, res) => {
  const { suhu, kelembaban, nh3 } = req.body;

  if (suhu === undefined || kelembaban === undefined || nh3 === undefined) {
    return res.status(400).json({ status: 'error', message: 'Data tidak lengkap' });
  }

  try {
    await pool.query(
      'INSERT INTO log_data (suhu, kelembaban, nh3) VALUES ($1, $2, $3)',
      [suhu, kelembaban, nh3]
    );

    console.log(`LOG 4 JAM: Suhu=${suhu}°C, Kelembaban=${kelembaban}%, NH3=${nh3}ppm`);
    res.json({ status: 'ok', message: 'Log berhasil disimpan' });
  } catch (err) {
    console.error('Error simpan log:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/latest - Data sensor terbaru
app.get('/api/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, suhu, kelembaban, nh3, to_char(timestamp AT TIME ZONE \'Asia/Jakarta\', \'YYYY-MM-DD HH24:MI:SS\') as timestamp FROM sensor_data ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({ status: 'empty', message: 'Belum ada data' });
    }

    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/history - 50 data terakhir untuk grafik
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, suhu, kelembaban, nh3, to_char(timestamp AT TIME ZONE \'Asia/Jakarta\', \'YYYY-MM-DD HH24:MI:SS\') as timestamp FROM sensor_data ORDER BY id DESC LIMIT 50'
    );

    res.json({ status: 'ok', data: result.rows.reverse() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/logs - Semua log 4 jam
app.get('/api/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await pool.query(
      'SELECT id, suhu, kelembaban, nh3, to_char(timestamp AT TIME ZONE \'Asia/Jakarta\', \'YYYY-MM-DD HH24:MI:SS\') as timestamp FROM log_data ORDER BY id DESC LIMIT $1',
      [limit]
    );

    res.json({ status: 'ok', data: result.rows.reverse() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/stats - Statistik
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ROUND(AVG(suhu)::numeric, 1) as avg_suhu,
        ROUND(MIN(suhu)::numeric, 1) as min_suhu,
        ROUND(MAX(suhu)::numeric, 1) as max_suhu,
        ROUND(AVG(kelembaban)::numeric, 1) as avg_kelembaban,
        ROUND(MIN(kelembaban)::numeric, 1) as min_kelembaban,
        ROUND(MAX(kelembaban)::numeric, 1) as max_kelembaban,
        ROUND(AVG(nh3)::numeric, 1) as avg_nh3,
        ROUND(MIN(nh3)::numeric, 1) as min_nh3,
        ROUND(MAX(nh3)::numeric, 1) as max_nh3,
        COUNT(*) as total_log
      FROM log_data
    `);

    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ==================== START SERVER ====================
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n===================================`);
    console.log(`  Server Monitoring Fermentasi Tempe`);
    console.log(`  Berjalan di: http://localhost:${PORT}`);
    console.log(`===================================\n`);
  });
});
