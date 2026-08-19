require('dotenv').config();

const REQUIRED_ENV_VARS = [
  'AUTH_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'VIEWER_USERNAME',
  'VIEWER_PASSWORD',
];

const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`❌ חסרים משתני סביבה נדרשים: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

module.exports = {
  AUTH_SECRET: process.env.AUTH_SECRET,
  TOKEN_MAX_AGE_MS: 8 * 60 * 60 * 1000,
  PORT: process.env.PORT || 5000,
};
