jest.mock('pg');

const request = require('supertest');
const XLSX = require('xlsx');
const { __mockQuery, __mockConnect } = require('pg');
const app = require('../server');
const { loginAs } = require('./helpers');

const buildWorkbookBuffer = (rows) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ציוד');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

beforeEach(() => {
  __mockQuery.mockClear();
  __mockConnect.mockClear();
  __mockQuery.mockImplementation((sql) => {
    if (sql.trim().startsWith('INSERT INTO forms')) {
      return Promise.resolve({ rows: [{ id: 1 }], rowCount: 1 });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
});

describe('POST /api/import-excel', () => {
  it('rejects unauthenticated requests', async () => {
    const buffer = buildWorkbookBuffer([{ 'שם עובד': 'x' }]);
    const res = await request(app)
      .post('/api/import-excel')
      .set('Content-Type', 'application/octet-stream')
      .send(buffer);

    expect(res.status).toBe(401);
  });

  it('rejects a request with no file body', async () => {
    const token = await loginAs(app, 'admin');
    const res = await request(app)
      .post('/api/import-excel')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.alloc(0));

    expect(res.status).toBe(400);
  });

  it('imports valid rows and reports invalid ones', async () => {
    const token = await loginAs(app, 'admin');
    const buffer = buildWorkbookBuffer([
      {
        'שם עובד': 'דנה כהן',
        'דוא"ל': 'dana@example.com',
        'מבנה': 'בניין א',
        'משרד': '101',
        'קטגוריה': 'מחשב',
        'יצרן': 'Dell',
        'דגם': 'Latitude',
        'אחסון': '512GB',
        'סיריאל': 'SN-1',
        'אינוונטר': 'INV-1',
      },
      {
        'שם עובד': '',
        'דוא"ל': 'missing-name@example.com',
        'מבנה': 'בניין א',
        'משרד': '101',
        'קטגוריה': 'מחשב',
        'יצרן': 'Dell',
        'דגם': 'Latitude',
        'אחסון': '512GB',
        'סיריאל': 'SN-2',
        'אינוונטר': 'INV-2',
      },
    ]);

    const res = await request(app)
      .post('/api/import-excel')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/octet-stream')
      .send(buffer);

    expect(res.status).toBe(201);
    expect(res.body.importedCount).toBe(1);
    expect(res.body.failedCount).toBe(1);
    expect(res.body.errors[0].row).toBe(3);
  });
});
