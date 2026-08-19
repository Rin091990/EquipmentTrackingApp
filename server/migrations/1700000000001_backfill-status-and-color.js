exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    UPDATE forms
    SET status = 'active'
    WHERE status IS NULL OR TRIM(status) = ''
  `);

  pgm.sql(`
    UPDATE forms
    SET color = 'שחור'
    WHERE category = 'computer'
      AND (color IS NULL OR TRIM(color) = '')
  `);
};

exports.down = () => {};
