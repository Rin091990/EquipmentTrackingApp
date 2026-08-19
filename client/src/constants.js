export const API_URL = 'http://localhost:5000/api';

export const emptyForm = {
  name: '',
  email: '',
  building: '',
  office: '',
  category: 'computer',
  status: 'active',
  manufacturer: '',
  model: '',
  color: 'שחור',
  storage: '512GB',
  serialNumber: '',
  inventorySerial: '',
};

export const emptyAccessoryForm = {
  type: 'monitor',
  manufacturer: '',
  model: '',
  size: '24',
  serialNumber: '',
  inventorySerial: '',
};

export const emptyEditForm = {
  name: '',
  email: '',
  building: '',
  office: '',
  status: 'active',
  inventorySerial: '',
};

export const accessoryTypeLabels = {
  monitor: 'מסך',
  printer: 'מדפסת',
  dockingStation: 'תחנת עגינה',
};

export const equipmentStatusLabels = {
  active: 'פעיל',
  scrapped: 'נגרט',
};
