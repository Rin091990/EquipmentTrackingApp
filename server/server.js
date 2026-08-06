require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const XLSX = require('xlsx');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

const AUTH_SECRET = process.env.AUTH_SECRET || 'equipment-tracking-dev-secret';
const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const users = [
  {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  },
  {
    username: process.env.VIEWER_USERNAME || 'viewer',
    password: process.env.VIEWER_PASSWORD || 'viewer123',
    role: 'viewer',
  },
];

const encodePayload = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString('base64url');

const signPayload = (payload) =>
  crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');

const createToken = (user) => {
  const payload = encodePayload({
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + TOKEN_MAX_AGE_MS,
  });

  return `${payload}.${signPayload(payload)}`;
};

const verifyToken = (token) => {
  if (!token || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  if (signature !== signPayload(payload)) return null;

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!user.expiresAt || Date.now() > user.expiresAt) return null;
    return user;
  } catch (err) {
    return null;
  }
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'נדרשת התחברות למערכת' });
  }

  req.user = user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'נדרשת הרשאת אדמין' });
  }

  next();
};

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
        building VARCHAR(255),
        office VARCHAR(255),
        category VARCHAR(100),
        amount DECIMAL(10,2),
        manufacturer VARCHAR(255),
        model VARCHAR(255),
        color VARCHAR(100),
        storage VARCHAR(50),
        serial_number VARCHAR(255),
        inventory_serial VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE forms
      ADD COLUMN IF NOT EXISTS building VARCHAR(255),
      ADD COLUMN IF NOT EXISTS office VARCHAR(255),
      ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),
      ADD COLUMN IF NOT EXISTS model VARCHAR(255),
      ADD COLUMN IF NOT EXISTS color VARCHAR(100),
      ADD COLUMN IF NOT EXISTS storage VARCHAR(50),
      ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS inventory_serial VARCHAR(255)
    `);

    await client.query(`
      UPDATE forms
      SET color = 'שחור'
      WHERE category = 'computer'
        AND (color IS NULL OR TRIM(color) = '')
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS office_accessories (
        id SERIAL PRIMARY KEY,
        building VARCHAR(255),
        office VARCHAR(255),
        type VARCHAR(100),
        manufacturer VARCHAR(255),
        model VARCHAR(255),
        size VARCHAR(50),
        serial_number VARCHAR(255),
        inventory_serial VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE office_accessories
      ADD COLUMN IF NOT EXISTS model VARCHAR(255),
      ADD COLUMN IF NOT EXISTS size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS inventory_serial VARCHAR(255)
    `);
    console.log('✅ טבלה "forms" מוכנה!');
  } catch (err) {
    console.error('❌ שגיאה ביצירת טבלה:', err.message);
  }
};

createTable();

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (item) => item.username === username && item.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  res.json({
    token: createToken(user),
    user: {
      username: user.username,
      role: user.role,
    },
  });
});

// API להוספת מידע
app.post('/api/submit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      building,
      office,
      category,
      manufacturer,
      model,
      color,
      storage,
      serialNumber,
      inventorySerial,
    } = req.body;
    
    if (
      !name ||
      !email ||
      !building ||
      !office ||
      !category ||
      !manufacturer ||
      !model ||
      !storage ||
      !serialNumber
    ) {
      return res.status(400).json({ error: 'חסרים נתונים!' });
    }

    if (category === 'phone' && !color) {
      return res.status(400).json({ error: 'חסר צבע לפלאפון!' });
    }

    if (category === 'computer' && !inventorySerial) {
      return res.status(400).json({ error: 'חסר סיריאל אינוונטר למחשב!' });
    }

    await client.query(
      `INSERT INTO forms
        (name, email, building, office, category, manufacturer, model, color, storage, serial_number, inventory_serial)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        name,
        email,
        building,
        office,
        category,
        manufacturer,
        model,
        category === 'computer' ? 'שחור' : color,
        storage,
        serialNumber,
        category === 'computer' ? inventorySerial : null,
      ]
    );
    res.status(201).json({ message: '✅ נשמר בהצלחה!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API להוספת ציוד נלווה למשרד
app.post('/api/office-accessories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { building, office, type, manufacturer, model, size, serialNumber, inventorySerial } = req.body;

    if (!building || !office || !type || !manufacturer) {
      return res.status(400).json({ error: 'חסרים נתונים לציוד נלווה!' });
    }

    if (type === 'monitor' && (!size || !serialNumber || !inventorySerial)) {
      return res.status(400).json({ error: 'חסרים נתוני מסך!' });
    }

    if (type === 'dockingStation' && (!serialNumber || !inventorySerial)) {
      return res.status(400).json({ error: 'חסרים נתוני תחנת עגינה!' });
    }

    if (type === 'printer' && !model) {
      return res.status(400).json({ error: 'חסר דגם למדפסת!' });
    }

    const result = await client.query(
      `INSERT INTO office_accessories
        (building, office, type, manufacturer, model, size, serial_number, inventory_serial)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        building,
        office,
        type,
        manufacturer,
        type === 'printer' ? model : null,
        type === 'monitor' ? size : null,
        type === 'monitor' || type === 'dockingStation' ? serialNumber : null,
        type === 'monitor' || type === 'dockingStation' ? inventorySerial : null,
      ]
    );

    res.status(201).json({ message: 'הציוד הנלווה נשמר בהצלחה!', row: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API לקבלת ציוד נלווה
app.get('/api/office-accessories', requireAuth, async (req, res) => {
  try {
    const result = await client.query(
      'SELECT * FROM office_accessories ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ליצוא Excel
app.get('/api/export', requireAuth, async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM forms ORDER BY created_at DESC');
    const records = result.rows.map((row) => ({
      name: row.name,
      email: row.email,
      building: row.building || '',
      office: row.office || '',
      category: row.category,
      manufacturer: row.manufacturer || '',
      model: row.model || '',
      color: row.color || '',
      storage: row.storage || '',
      serial_number: row.serial_number || '',
      inventory_serial: row.inventory_serial || '',
      created_at: row.created_at,
    }));

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
app.get('/api/data', requireAuth, async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM forms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API לעדכון רשומה קיימת
app.put('/api/update/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, building, office, inventorySerial } = req.body;

    if (!name || !email || !building || !office) {
      return res.status(400).json({ error: 'חסרים נתונים לעדכון!' });
    }

    const current = await client.query('SELECT category FROM forms WHERE id = $1', [id]);

    if (current.rowCount === 0) {
      return res.status(404).json({ error: 'הרשומה לא נמצאה' });
    }

    if (current.rows[0].category === 'computer' && !inventorySerial) {
      return res.status(400).json({ error: 'חסר סיריאל אינוונטר למחשב!' });
    }

    const result = await client.query(
      `UPDATE forms
       SET name = $1,
           email = $2,
           building = $3,
           office = $4,
           inventory_serial = CASE WHEN category = 'computer' THEN $5 ELSE inventory_serial END
       WHERE id = $6
       RETURNING *`,
      [name, email, building, office, inventorySerial, id]
    );

    res.json({ message: 'השינויים נשמרו בהצלחה!', row: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API למחיקת רשומה
app.delete('/api/delete/:id', requireAuth, requireAdmin, async (req, res) => {
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
