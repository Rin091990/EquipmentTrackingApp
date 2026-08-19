exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable(
    'forms',
    {
      id: 'id',
      name: { type: 'varchar(255)' },
      email: { type: 'varchar(255)' },
      building: { type: 'varchar(255)' },
      office: { type: 'varchar(255)' },
      category: { type: 'varchar(100)' },
      amount: { type: 'decimal(10,2)' },
      manufacturer: { type: 'varchar(255)' },
      model: { type: 'varchar(255)' },
      color: { type: 'varchar(100)' },
      storage: { type: 'varchar(50)' },
      serial_number: { type: 'varchar(255)' },
      inventory_serial: { type: 'varchar(255)' },
      status: { type: 'varchar(50)', default: 'active' },
      created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    },
    { ifNotExists: true }
  );

  pgm.createTable(
    'office_accessories',
    {
      id: 'id',
      building: { type: 'varchar(255)' },
      office: { type: 'varchar(255)' },
      type: { type: 'varchar(100)' },
      manufacturer: { type: 'varchar(255)' },
      model: { type: 'varchar(255)' },
      size: { type: 'varchar(50)' },
      serial_number: { type: 'varchar(255)' },
      inventory_serial: { type: 'varchar(255)' },
      created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    },
    { ifNotExists: true }
  );

  pgm.createTable(
    'item_history',
    {
      id: 'id',
      item_id: { type: 'integer' },
      serial_number: { type: 'varchar(255)' },
      inventory_serial: { type: 'varchar(255)' },
      field_name: { type: 'varchar(100)' },
      old_value: { type: 'text' },
      new_value: { type: 'text' },
      change_summary: { type: 'text' },
      name: { type: 'varchar(255)' },
      email: { type: 'varchar(255)' },
      building: { type: 'varchar(255)' },
      office: { type: 'varchar(255)' },
      category: { type: 'varchar(100)' },
      status: { type: 'varchar(50)' },
      manufacturer: { type: 'varchar(255)' },
      model: { type: 'varchar(255)' },
      color: { type: 'varchar(100)' },
      storage: { type: 'varchar(50)' },
      previous_serial_number: { type: 'varchar(255)' },
      previous_inventory_serial: { type: 'varchar(255)' },
      previous_name: { type: 'varchar(255)' },
      previous_email: { type: 'varchar(255)' },
      previous_building: { type: 'varchar(255)' },
      previous_office: { type: 'varchar(255)' },
      previous_category: { type: 'varchar(100)' },
      previous_status: { type: 'varchar(50)' },
      previous_manufacturer: { type: 'varchar(255)' },
      previous_model: { type: 'varchar(255)' },
      previous_color: { type: 'varchar(100)' },
      previous_storage: { type: 'varchar(50)' },
      changed_by: { type: 'varchar(255)' },
      created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    },
    { ifNotExists: true }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('item_history', { ifExists: true });
  pgm.dropTable('office_accessories', { ifExists: true });
  pgm.dropTable('forms', { ifExists: true });
};
