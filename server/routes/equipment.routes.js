const express = require('express');
const XLSX = require('xlsx');
const client = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

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

router.post(
  '/import-excel',
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

router.post('/submit', requireAuth, requireAdmin, async (req, res) => {
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

router.get('/data', requireAuth, async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM forms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:id', requireAuth, async (req, res) => {
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

router.put('/update/:id', requireAuth, requireAdmin, async (req, res) => {
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

router.delete('/delete/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await client.query('DELETE FROM forms WHERE id = $1', [id]);
    res.json({ message: '✅ נמחק בהצלחה!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
