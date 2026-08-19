require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const XLSX = require('xlsx');
const cors = require('cors');
const crypto = require('crypto');

const REQUIRED_ENV_VARS = [
  'AUTH_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'VIEWER_USERNAME',
  'VIEWER_PASSWORD',
];

const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`❌ חסרים משתני סביבה נדרשים: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(cors());

const AUTH_SECRET = process.env.AUTH_SECRET;
const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const users = [
  {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
  },
  {
    username: process.env.VIEWER_USERNAME,
    password: process.env.VIEWER_PASSWORD,
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
const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

client.on('error', (err) => {
  console.error('PostgreSQL idle client error:', err.message);
});

client.query('SELECT 1').then(() => {
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
        status VARCHAR(50) DEFAULT 'active',
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
      ADD COLUMN IF NOT EXISTS inventory_serial VARCHAR(255),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'
    `);

    await client.query(`
      UPDATE forms
      SET status = 'active'
      WHERE status IS NULL OR TRIM(status) = ''
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS item_history (
        id SERIAL PRIMARY KEY,
        item_id INTEGER,
        serial_number VARCHAR(255),
        inventory_serial VARCHAR(255),
        field_name VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        change_summary TEXT,
        name VARCHAR(255),
        email VARCHAR(255),
        building VARCHAR(255),
        office VARCHAR(255),
        category VARCHAR(100),
        status VARCHAR(50),
        manufacturer VARCHAR(255),
        model VARCHAR(255),
        color VARCHAR(100),
        storage VARCHAR(50),
        previous_serial_number VARCHAR(255),
        previous_inventory_serial VARCHAR(255),
        previous_name VARCHAR(255),
        previous_email VARCHAR(255),
        previous_building VARCHAR(255),
        previous_office VARCHAR(255),
        previous_category VARCHAR(100),
        previous_status VARCHAR(50),
        previous_manufacturer VARCHAR(255),
        previous_model VARCHAR(255),
        previous_color VARCHAR(100),
        previous_storage VARCHAR(50),
        changed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE item_history
      ADD COLUMN IF NOT EXISTS change_summary TEXT,
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS building VARCHAR(255),
      ADD COLUMN IF NOT EXISTS office VARCHAR(255),
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),
      ADD COLUMN IF NOT EXISTS model VARCHAR(255),
      ADD COLUMN IF NOT EXISTS color VARCHAR(100),
      ADD COLUMN IF NOT EXISTS storage VARCHAR(50),
      ADD COLUMN IF NOT EXISTS previous_serial_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_inventory_serial VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_building VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_office VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS previous_manufacturer VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_model VARCHAR(255),
      ADD COLUMN IF NOT EXISTS previous_color VARCHAR(100),
      ADD COLUMN IF NOT EXISTS previous_storage VARCHAR(50)
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
const getExcelValue = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
};

const normalizeImportedCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['computer', 'מחשב'].includes(normalized)) return 'computer';
  if (['phone', 'פלאפון', 'טלפון'].includes(normalized)) return 'phone';
  return '';
};

const normalizeImportedStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['scrapped', 'נגרט', 'גרוט'].includes(normalized)) return 'scrapped';
  return 'active';
};

const buildImportedRecord = (row) => {
  const category = normalizeImportedCategory(getExcelValue(row, ['קטגוריה', 'category']));

  return {
    name: getExcelValue(row, ['שם עובד', 'name']),
    email: getExcelValue(row, ['דוא"ל', 'דואל', 'email']),
    building: getExcelValue(row, ['מבנה', 'building']),
    office: getExcelValue(row, ['משרד', 'office']),
    category,
    manufacturer: getExcelValue(row, ['יצרן', 'manufacturer']),
    model: getExcelValue(row, ['דגם', 'model']),
    color: getExcelValue(row, ['צבע', 'color']),
    storage: getExcelValue(row, ['אחסון', 'מקום', 'storage']),
    serialNumber: getExcelValue(row, ['סיריאל', 'serial', 'serial_number']),
    inventorySerial: getExcelValue(row, ['אינוונטר', 'inventory', 'inventory_serial']),
    status: normalizeImportedStatus(getExcelValue(row, ['סטטוס', 'status'])),
  };
};

const validateImportedRecord = (record) => {
  if (
    !record.name ||
    !record.email ||
    !record.building ||
    !record.office ||
    !record.category ||
    !record.manufacturer ||
    !record.model ||
    !record.storage ||
    !record.serialNumber
  ) {
    return 'חסרים נתוני חובה';
  }

  if (record.category === 'phone' && !record.color) {
    return 'חסר צבע לפלאפון';
  }

  if (record.category === 'computer' && !record.inventorySerial) {
    return 'חסר אינוונטר למחשב';
  }

  return '';
};

app.post(
  '/api/import-excel',
  requireAuth,
  requireAdmin,
  express.raw({
    type: [
      'application/octet-stream',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
    limit: '8mb',
  }),
  async (req, res) => {
    try {
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: 'לא נבחר קובץ Excel' });
      }

      const workbook = XLSX.read(req.body, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return res.status(400).json({ error: 'קובץ Excel ריק' });
      }

      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
        defval: '',
      });

      if (rows.length === 0) {
        return res.status(400).json({ error: 'לא נמצאו שורות לייבוא' });
      }

      const imported = [];
      const errors = [];
      const txClient = await client.connect();

      try {
        await txClient.query('BEGIN');

      for (const [index, row] of rows.entries()) {
        const record = buildImportedRecord(row);
        const validationError = validateImportedRecord(record);

        if (validationError) {
          errors.push({ row: index + 2, error: validationError });
          continue;
        }

        const result = await txClient.query(
          `INSERT INTO forms
            (name, email, building, office, category, manufacturer, model, color, storage, serial_number, inventory_serial, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            record.name,
            record.email,
            record.building,
            record.office,
            record.category,
            record.manufacturer,
            record.model,
            record.category === 'computer' ? 'שחור' : record.color,
            record.storage,
            record.serialNumber,
            record.category === 'computer' ? record.inventorySerial : null,
            record.status,
          ]
        );

        imported.push(result.rows[0]);
      }

        await txClient.query('COMMIT');
      } catch (err) {
        await txClient.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        txClient.release();
      }

      if (imported.length === 0) {
        return res.status(400).json({
          error: 'לא יובאו רשומות',
          importedCount: 0,
          failedCount: errors.length,
          errors,
        });
      }

      res.status(201).json({
        message: `יובאו ${imported.length} רשומות בהצלחה`,
        importedCount: imported.length,
        failedCount: errors.length,
        errors,
        rows: imported,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

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
      status = 'active',
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
      !serialNumber ||
      !['active', 'scrapped'].includes(status)
    ) {
      return res.status(400).json({ error: 'חסרים נתונים!' });
    }

    if (category === 'phone' && !color) {
      return res.status(400).json({ error: 'חסר צבע לפלאפון!' });
    }

    if (category === 'computer' && !inventorySerial) {
      return res.status(400).json({ error: 'חסר אינוונטר למחשב!' });
    }

    await client.query(
      `INSERT INTO forms
        (name, email, building, office, category, manufacturer, model, color, storage, serial_number, inventory_serial, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
        status,
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
      status: row.status === 'scrapped' ? 'נגרט' : 'פעיל',
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

// API ליצוא רשומות מסומנות
app.post('/api/export-selected', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { ids, exportType } = req.body;

    if (!Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({ error: 'צריך לבחור לפחות שתי רשומות' });
    }

    const exportColumn = exportType === 'travel' ? 'הוחזר' : 'קיים';
    const fileName = exportType === 'travel' ? 'travel-form.xlsx' : 'audit-form.xlsx';
    const numericIds = ids.map(Number).filter((id) => Number.isInteger(id));

    if (numericIds.length < 2) {
      return res.status(400).json({ error: 'בחירת הרשומות לא תקינה' });
    }

    const result = await client.query(
      'SELECT * FROM forms WHERE id = ANY($1::int[]) ORDER BY created_at DESC',
      [numericIds]
    );

    const records = result.rows.map((row) => ({
      'שם עובד': row.name || '',
      'דוא"ל': row.email || '',
      'מבנה': row.building || '',
      'משרד': row.office || '',
      'קטגוריה': row.category === 'computer' ? 'מחשב' : 'פלאפון',
      'יצרן': row.manufacturer || '',
      'דגם': row.model || '',
      'צבע': row.color || '',
      'אחסון': row.storage || '',
      'סיריאל': row.serial_number || '',
      'אינוונטר': row.inventory_serial || '',
      'סטטוס': row.status === 'scrapped' ? 'נגרט' : 'פעיל',
      [exportColumn]: '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(records);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ציוד');

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API לקבלת כל הנתונים
app.get('/api/export-employee-equipment/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const selectedResult = await client.query('SELECT * FROM forms WHERE id = $1', [id]);

    if (selectedResult.rowCount === 0) {
      return res.status(404).json({ error: 'הרשומה לא נמצאה' });
    }

    const selected = selectedResult.rows[0];
    const equipmentResult = await client.query(
      `SELECT *
       FROM forms
       WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
          OR LOWER(TRIM(name)) = LOWER(TRIM($2))
       ORDER BY created_at DESC`,
      [selected.email || '', selected.name || '']
    );

    const workbook = XLSX.utils.book_new();
    const equipmentHeaders = [
      'שם עובד',
      'דוא"ל',
      'ציוד',
      'סיריאל',
      'תאריך הפקה',
      'חתימת עובד',
      'חתימת אחראי',
    ];
    const employeeFormRows = equipmentResult.rows.map((row) => ({
      'שם עובד': selected.name || '',
      'דוא"ל': selected.email || '',
      'ציוד': [row.manufacturer, row.model].filter(Boolean).join(' - '),
      'סיריאל': row.serial_number || '',
      'תאריך הפקה': new Date().toLocaleDateString('he-IL'),
      'חתימת עובד': '',
      'חתימת אחראי': '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(employeeFormRows, {
      header: equipmentHeaders,
      skipHeader: false,
    });
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 28 },
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'טופס ציוד');

    const safeName = String(selected.name || 'employee').replace(/[\\/:*?"<>|]/g, '-');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=employee-equipment-${encodeURIComponent(safeName)}.xlsx`
    );
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/data', requireAuth, async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM forms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API לקבלת היסטוריית פריט
app.get('/api/history/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      `SELECT *
       FROM item_history
       WHERE item_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API לעדכון רשומה קיימת
app.put('/api/update/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, building, office, inventorySerial, status = 'active' } = req.body;

    if (!name || !email || !building || !office || !['active', 'scrapped'].includes(status)) {
      return res.status(400).json({ error: 'חסרים נתונים לעדכון!' });
    }

    const current = await client.query('SELECT * FROM forms WHERE id = $1', [id]);

    if (current.rowCount === 0) {
      return res.status(404).json({ error: 'הרשומה לא נמצאה' });
    }

    const currentRow = current.rows[0];

    if (currentRow.category === 'computer' && !inventorySerial) {
      return res.status(400).json({ error: 'חסר אינוונטר למחשב!' });
    }

    const historyFields = [
      { key: 'name', label: 'שם עובד', oldValue: currentRow.name, newValue: name },
      { key: 'email', label: 'דוא"ל', oldValue: currentRow.email, newValue: email },
      { key: 'building', label: 'מבנה', oldValue: currentRow.building, newValue: building },
      { key: 'office', label: 'משרד', oldValue: currentRow.office, newValue: office },
      {
        key: 'status',
        label: 'סטטוס',
        oldValue: currentRow.status === 'scrapped' ? 'נגרט' : 'פעיל',
        newValue: status === 'scrapped' ? 'נגרט' : 'פעיל',
      },
      {
        key: 'inventory_serial',
        label: 'אינוונטר',
        oldValue: currentRow.inventory_serial,
        newValue: currentRow.category === 'computer' ? inventorySerial : currentRow.inventory_serial,
      },
    ];

    const changedFields = historyFields.filter(
      (field) => String(field.oldValue || '') !== String(field.newValue || '')
    );

    const result = await client.query(
      `UPDATE forms
       SET name = $1,
           email = $2,
           building = $3,
           office = $4,
           status = $5,
           inventory_serial = CASE WHEN category = 'computer' THEN $6 ELSE inventory_serial END
       WHERE id = $7
       RETURNING *`,
      [name, email, building, office, status, inventorySerial, id]
    );

    if (changedFields.length > 0) {
      const updatedRow = result.rows[0];

      await client.query(
        `INSERT INTO item_history
          (
            item_id,
            serial_number,
            inventory_serial,
            field_name,
            old_value,
            new_value,
            change_summary,
            name,
            email,
            building,
            office,
            category,
            status,
            manufacturer,
            model,
            color,
            storage,
            previous_serial_number,
            previous_inventory_serial,
            previous_name,
            previous_email,
            previous_building,
            previous_office,
            previous_category,
            previous_status,
            previous_manufacturer,
            previous_model,
            previous_color,
            previous_storage,
            changed_by
          )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
           $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
         )`,
        [
          id,
          updatedRow.serial_number,
          updatedRow.inventory_serial,
          changedFields.map((field) => field.label).join(', '),
          changedFields
            .map((field) => `${field.label}: ${field.oldValue || '-'}`)
            .join(' | '),
          changedFields
            .map((field) => `${field.label}: ${field.newValue || '-'}`)
            .join(' | '),
          changedFields.map((field) => field.label).join(', '),
          updatedRow.name,
          updatedRow.email,
          updatedRow.building,
          updatedRow.office,
          updatedRow.category,
          updatedRow.status,
          updatedRow.manufacturer,
          updatedRow.model,
          updatedRow.color,
          updatedRow.storage,
          currentRow.serial_number,
          currentRow.inventory_serial,
          currentRow.name,
          currentRow.email,
          currentRow.building,
          currentRow.office,
          currentRow.category,
          currentRow.status,
          currentRow.manufacturer,
          currentRow.model,
          currentRow.color,
          currentRow.storage,
          req.user?.username || 'admin',
        ]
      );
    }

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
