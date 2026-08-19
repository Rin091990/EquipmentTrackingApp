const express = require('express');
const XLSX = require('xlsx');
const client = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

router.get('/export', requireAuth, async (req, res) => {
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

router.post('/export-selected', requireAuth, requireAdmin, async (req, res) => {
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

router.get('/export-employee-equipment/:id', requireAuth, async (req, res) => {
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

module.exports = router;
