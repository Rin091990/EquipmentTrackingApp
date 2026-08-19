jest.mock('pg');

const request = require('supertest');
const { __mockQuery } = require('pg');
const app = require('../server');
const { loginAs } = require('./helpers');

const currentRow = {
  id: 1,
  name: 'עובד ישן',
  email: 'old@example.com',
  building: 'בניין א',
  office: '101',
  category: 'computer',
  status: 'active',
  manufacturer: 'Dell',
  model: 'Latitude',
  color: 'שחור',
  storage: '512GB',
  serial_number: 'SN-1',
  inventory_serial: 'INV-1',
};

const mockSelectThenUpdate = () => {
  __mockQuery.mockImplementation((sql, params) => {
    if (sql.includes('SELECT * FROM forms WHERE id')) {
      return Promise.resolve({ rows: [currentRow], rowCount: 1 });
    }
    if (sql.trim().startsWith('UPDATE forms')) {
      const updatedRow = {
        ...currentRow,
        name: params[0],
        email: params[1],
        building: params[2],
        office: params[3],
        status: params[4],
        inventory_serial: params[5],
      };
      return Promise.resolve({ rows: [updatedRow], rowCount: 1 });
    }
    if (sql.includes('INSERT INTO item_history')) {
      return Promise.resolve({ rows: [], rowCount: 1 });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
};

beforeEach(() => {
  __mockQuery.mockClear();
  __mockQuery.mockReset();
  __mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('PUT /api/update/:id', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).put('/api/update/1').send({});
    expect(res.status).toBe(401);
  });

  it('rejects viewer role', async () => {
    const token = await loginAs(app, 'viewer');
    const res = await request(app)
      .put('/api/update/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'x', email: 'x@x.com', building: 'a', office: 'b' });

    expect(res.status).toBe(403);
  });

  it('returns 404 when the record does not exist', async () => {
    __mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
    const token = await loginAs(app, 'admin');

    const res = await request(app)
      .put('/api/update/999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'x', email: 'x@x.com', building: 'a', office: 'b' });

    expect(res.status).toBe(404);
  });

  it('rejects a computer update missing inventory serial', async () => {
    __mockQuery.mockImplementation((sql) => {
      if (sql.includes('SELECT * FROM forms WHERE id')) {
        return Promise.resolve({ rows: [currentRow], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
    const token = await loginAs(app, 'admin');

    const res = await request(app)
      .put('/api/update/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'שם חדש', email: 'old@example.com', building: 'בניין א', office: '101' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('אינוונטר');
  });

  it('updates the record and writes a history entry when fields change', async () => {
    mockSelectThenUpdate();
    const token = await loginAs(app, 'admin');

    const res = await request(app)
      .put('/api/update/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'עובד חדש',
        email: 'old@example.com',
        building: 'בניין א',
        office: '101',
        inventorySerial: 'INV-1',
      });

    expect(res.status).toBe(200);

    const historyCall = __mockQuery.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO item_history')
    );
    expect(historyCall).toBeTruthy();
    const [, params] = historyCall;
    expect(params[3]).toContain('שם עובד');
  });

  it('does not write history when nothing changed', async () => {
    mockSelectThenUpdate();
    const token = await loginAs(app, 'admin');

    const res = await request(app)
      .put('/api/update/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: currentRow.name,
        email: currentRow.email,
        building: currentRow.building,
        office: currentRow.office,
        inventorySerial: currentRow.inventory_serial,
      });

    expect(res.status).toBe(200);

    const historyCall = __mockQuery.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO item_history')
    );
    expect(historyCall).toBeUndefined();
  });
});
