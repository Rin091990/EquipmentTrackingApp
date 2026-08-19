jest.mock('pg');

const request = require('supertest');
const { __mockQuery } = require('pg');
const app = require('../server');
const { loginAs } = require('./helpers');

const validComputer = {
  name: 'דנה כהן',
  email: 'dana@example.com',
  building: 'בניין א',
  office: '101',
  category: 'computer',
  manufacturer: 'Dell',
  model: 'Latitude 5420',
  storage: '512GB',
  serialNumber: 'SN-123',
  inventorySerial: 'INV-456',
};

const validPhone = {
  name: 'יוסי לוי',
  email: 'yossi@example.com',
  building: 'בניין ב',
  office: '202',
  category: 'phone',
  manufacturer: 'Apple',
  model: 'iPhone 15',
  color: 'שחור',
  storage: '128GB',
  serialNumber: 'SN-789',
};

beforeEach(() => {
  __mockQuery.mockClear();
  __mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('POST /api/submit', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/submit').send(validComputer);
    expect(res.status).toBe(401);
  });

  it('rejects viewer role', async () => {
    const token = await loginAs(app, 'viewer');
    const res = await request(app)
      .post('/api/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(validComputer);

    expect(res.status).toBe(403);
  });

  it('rejects a submission missing required fields', async () => {
    const token = await loginAs(app, 'admin');
    const { name, ...incomplete } = validComputer;

    const res = await request(app)
      .post('/api/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(incomplete);

    expect(res.status).toBe(400);
  });

  it('rejects a phone with no color', async () => {
    const token = await loginAs(app, 'admin');
    const { color, ...phoneNoColor } = validPhone;

    const res = await request(app)
      .post('/api/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(phoneNoColor);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('צבע');
  });

  it('rejects a computer with no inventory serial', async () => {
    const token = await loginAs(app, 'admin');
    const { inventorySerial, ...computerNoInventory } = validComputer;

    const res = await request(app)
      .post('/api/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(computerNoInventory);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('אינוונטר');
  });

  it('inserts a valid computer, forcing its color to black', async () => {
    const token = await loginAs(app, 'admin');

    const res = await request(app)
      .post('/api/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(validComputer);

    expect(res.status).toBe(201);

    const insertCall = __mockQuery.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO forms')
    );
    expect(insertCall).toBeTruthy();
    const [, params] = insertCall;
    expect(params).toEqual([
      validComputer.name,
      validComputer.email,
      validComputer.building,
      validComputer.office,
      'computer',
      validComputer.manufacturer,
      validComputer.model,
      'שחור',
      validComputer.storage,
      validComputer.serialNumber,
      validComputer.inventorySerial,
      'active',
    ]);
  });

  it('inserts a valid phone with no inventory serial', async () => {
    const token = await loginAs(app, 'admin');

    const res = await request(app)
      .post('/api/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(validPhone);

    expect(res.status).toBe(201);

    const insertCall = __mockQuery.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO forms')
    );
    const [, params] = insertCall;
    expect(params[7]).toBe(validPhone.color);
    expect(params[10]).toBeNull();
  });
});
