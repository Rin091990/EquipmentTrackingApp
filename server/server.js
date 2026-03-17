require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const XLSX = require('xlsx');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// התחבר ל-Neon
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect().then(() => {
  console.log('✅ התחברנו ל-Neon בהצלחה!');
}).catch(err => {
  console.error('❌ שגיאה בחיבור:', err.message);
});

// צור טבלה בעת התחלה
const createTable = async () => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        category VARCHAR(100),
        amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ טבלה "forms" מוכנה!');
  } catch (err) {
    console.error('❌ שגיאה ביצירת טבלה:', err.message);
  }
};

createTable();

// API להוספת מידע
app.post('/api/submit', async (req, res) => {
  try {
    const { name, email, category, amount } = req.body;
    
    if (!name || !email || !category || !amount) {
      return res.status(400).json({ error: 'חסרים נתונים!' });
    }

    await client.query(
      'INSERT INTO forms (name, email, category, amount) VALUES ($1, $2, $3, $4)',
      [name, email, category, parseFloat(amount)]
    );
    res.status(201).json({ message: '✅ נשמר בהצלחה!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API ליצוא Excel
app.get('/api/export', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM forms ORDER BY created_at DESC');
    const records = result.rows;

    if (records.length === 0) {
      return res.status(404).json({ error: 'אין נתונים לייצא' });
    }

    // יצירת Workbook
    const workbook = XLSX.utils.book_new();

    // יצירת גיליונות נפרדים לפי קטגוריה
    const categories = [...new Set(records.map(r => r.category || 'Other'))];

    categories.forEach(cat => {
      const filtered = records.filter(r => (r.category || 'Other') === cat);
      const worksheet = XLSX.utils.json_to_sheet(filtered);
      XLSX.utils.book_append_sheet(workbook, worksheet, cat);
    });

    // גיליון סיכום עם כל הנתונים
    const summarySheet = XLSX.utils.json_to_sheet(records);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'הכל');

    // שליחת הקובץ
    res.setHeader('Content-Disposition', 'attachment; filename=export.xlsx');
    res.type('application/vnd.ms-excel');
    res.send(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API לקבלת כל הנתונים
app.get('/api/data', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM forms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API למחיקת רשומה
app.delete('/api/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await client.query('DELETE FROM forms WHERE id = $1', [id]);
    res.json({ message: '✅ נמחק בהצלחה!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});