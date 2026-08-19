const express = require('express');
const client = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

router.post('/office-accessories', requireAuth, requireAdmin, async (req, res) => {
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

router.get('/office-accessories', requireAuth, async (req, res) => {
  try {
    const result = await client.query(
      'SELECT * FROM office_accessories ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
