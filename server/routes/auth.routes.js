const express = require('express');
const { users, createToken } = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
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

module.exports = router;
