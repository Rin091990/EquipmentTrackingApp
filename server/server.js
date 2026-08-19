const { PORT } = require('./config');
require('./db');

const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api', require('./routes/auth.routes'));
app.use('/api', require('./routes/equipment.routes'));
app.use('/api', require('./routes/accessories.routes'));
app.use('/api', require('./routes/export.routes'));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
