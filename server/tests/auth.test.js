jest.mock('pg');

const request = require('supertest');
const { __mockQuery } = require('pg');
const app = require('../server');

beforeEach(() => {
  __mockQuery.mockClear();
  __mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('POST /api/login', () => {
  it('returns a token and role for valid admin credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'admin-pass' });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ username: 'admin', role: 'admin' });
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.split('.')).toHaveLength(2);
  });

  it('returns a token and role for valid viewer credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'viewer', password: 'viewer-pass' });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ username: 'viewer', role: 'viewer' });
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects an unknown username', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'nobody', password: 'admin-pass' });

    expect(res.status).toBe(401);
  });
});

describe('authenticated route access', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/data');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a garbage token', async () => {
    const res = await request(app)
      .get('/api/data')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forgedPayload = Buffer.from(
      JSON.stringify({ username: 'admin', role: 'admin', expiresAt: Date.now() + 1000000 })
    ).toString('base64url');
    const forgedToken = `${forgedPayload}.forged-signature`;

    const res = await request(app)
      .get('/api/data')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
  });

  it('allows a valid admin token through to a protected route', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'admin-pass' });

    const res = await request(app)
      .get('/api/data')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
  });

  it('blocks a viewer token from an admin-only route', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'viewer', password: 'viewer-pass' });

    const res = await request(app)
      .delete('/api/delete/1')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(403);
  });
});
