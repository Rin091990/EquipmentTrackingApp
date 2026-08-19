const request = require('supertest');

const loginAs = async (app, role) => {
  const credentials =
    role === 'admin'
      ? { username: 'admin', password: 'admin-pass' }
      : { username: 'viewer', password: 'viewer-pass' };

  const res = await request(app).post('/api/login').send(credentials);
  return res.body.token;
};

module.exports = { loginAs };
