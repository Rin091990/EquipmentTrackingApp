import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function getSavedAuth() {
  try {
    return JSON.parse(localStorage.getItem('equipmentAuth')) || null;
  } catch (err) {
    return null;
  }
}

const emptyForm = {
  name: '',
  email: '',
  building: '',
  office: '',
  category: 'computer',
  manufacturer: '',
  model: '',
  color: 'שחור',
  storage: '512GB',
  serialNumber: '',
  inventorySerial: '',
};

const emptyAccessoryForm = {
  type: 'monitor',
  manufacturer: '',
  model: '',
  size: '24',
  serialNumber: '',
  inventorySerial: '',
};

const accessoryTypeLabels = {
  monitor: 'מסך',
  printer: 'מדפסת',
  dockingStation: 'תחנת עגינה',
};

function App() {
  const [auth, setAuth] = useState(getSavedAuth);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [data, setData] = useState([]);
  const [officeAccessories, setOfficeAccessories] = useState([]);
  const [accessoryForm, setAccessoryForm] = useState(emptyAccessoryForm);
  const [historyItem, setHistoryItem] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyBackSection, setHistoryBackSection] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingSearchTerm, setBuildingSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    building: '',
    office: '',
    inventorySerial: '',
  });
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [activeEditField, setActiveEditField] = useState(null);
  const isMonitorAccessory = accessoryForm.type === 'monitor';
  const isPrinterAccessory = accessoryForm.type === 'printer';
  const isDockingStationAccessory = accessoryForm.type === 'dockingStation';
  const showAccessorySerialFields = isMonitorAccessory || isDockingStationAccessory;

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });

    if (auth?.token) {
      instance.defaults.headers.common.Authorization = `Bearer ${auth.token}`;
    }

    return instance;
  }, [auth]);

  const isAdmin = auth?.user?.role === 'admin';
  const isComputer = form.category === 'computer';
  const isPhone = form.category === 'phone';
  const showEquipmentForm = isAdmin && selectedSection === 'newEquipment';
  const showDataTable = selectedSection === 'general';
  const buildings = useMemo(() => {
    const names = data
      .map((row) => row.building?.trim())
      .filter(Boolean);

    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'he'));
  }, [data]);

  const selectedBuildingRows = useMemo(() => {
    if (!selectedBuilding) return [];

    const normalizedSearch = buildingSearchTerm.trim().toLowerCase();
    const rows = data.filter((row) => row.building?.trim() === selectedBuilding);
    const filteredRows = normalizedSearch
      ? rows.filter((row) =>
          [row.name, row.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearch))
        )
      : rows;

    return filteredRows
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [buildingSearchTerm, data, selectedBuilding]);

  const selectedOfficeRows = useMemo(() => {
    if (!selectedOffice) return [];

    return data
      .filter((row) => {
        const sameOffice = String(row.office || '').trim() === selectedOffice;
        const sameBuilding = selectedBuilding
          ? String(row.building || '').trim() === selectedBuilding
          : true;

        return sameOffice && sameBuilding;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data, selectedBuilding, selectedOffice]);

  const selectedOfficeAccessories = useMemo(() => {
    if (!selectedOffice) return [];

    return officeAccessories.filter((item) => {
      const sameOffice = String(item.office || '').trim() === selectedOffice;
      const sameBuilding = selectedBuilding
        ? String(item.building || '').trim() === selectedBuilding
        : true;

      return sameOffice && sameBuilding;
    });
  }, [officeAccessories, selectedBuilding, selectedOffice]);

  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const rows = normalizedSearch
      ? data.filter((row) =>
          [
            row.name,
            row.email,
            row.building,
            row.office,
            row.category,
            row.manufacturer,
            row.model,
            row.serial_number,
            row.inventory_serial,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearch))
        )
      : data;

    return [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data, searchTerm]);

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await axios.post(`${API_URL}/login`, loginForm);
      localStorage.setItem('equipmentAuth', JSON.stringify(response.data));
      setAuth(response.data);
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      setLoginError(err.response?.data?.error || 'שגיאה בהתחברות');
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('equipmentAuth');
    setAuth(null);
    setData([]);
    setOfficeAccessories([]);
    setHistoryItem(null);
    setHistoryRows([]);
    setBuildingSearchTerm('');
    setSelectedSection('');
    setSelectedBuilding('');
    setSelectedOffice('');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/data');
      setData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        console.error('שגיאה בטעינת נתונים:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [api, handleLogout]);

  const fetchOfficeAccessories = useCallback(async () => {
    try {
      const response = await api.get('/office-accessories');
      setOfficeAccessories(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        console.error('שגיאה בטעינת ציוד נלווה:', err);
      }
    }
  }, [api, handleLogout]);

  useEffect(() => {
    if (
      auth?.token &&
      (selectedSection === 'general' ||
        selectedSection === 'newEquipment' ||
        selectedSection === 'buildings' ||
        selectedSection === 'buildingDetails' ||
        selectedSection === 'officeDetails' ||
        selectedSection === 'itemHistory')
    ) {
      fetchData();
      if (selectedSection === 'officeDetails') {
        fetchOfficeAccessories();
      }
    }
  }, [auth?.token, fetchData, fetchOfficeAccessories, selectedSection]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'category') {
      setForm({
        ...form,
        category: value,
        storage: value === 'computer' ? '512GB' : '256GB',
        color: value === 'computer' ? 'שחור' : '',
        inventorySerial: value === 'computer' ? form.inventorySerial : '',
      });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) return;

    try {
      await api.post('/submit', form);
      alert('המידע נשמר בהצלחה!');
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      alert('שגיאה: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAccessoryChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      setAccessoryForm({
        ...emptyAccessoryForm,
        type: value,
      });
      return;
    }

    setAccessoryForm((current) => ({ ...current, [name]: value }));
  };

  const handleAccessorySubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin || !selectedOffice) return;

    try {
      const response = await api.post('/office-accessories', {
        ...accessoryForm,
        building: selectedBuilding,
        office: selectedOffice,
      });
      setOfficeAccessories((current) => [response.data.row, ...current]);
      setAccessoryForm(emptyAccessoryForm);
      alert('הציוד הנלווה נשמר בהצלחה!');
    } catch (err) {
      alert('שגיאה: ' + (err.response?.data?.error || err.message));
    }
  };

  const startEdit = (row) => {
    if (!isAdmin) return;

    setSelectedActionId(row.id);
    setEditingId(row.id);
    setActiveEditField(null);
    setEditForm({
      name: row.name || '',
      email: row.email || '',
      building: row.building || '',
      office: row.office || '',
      inventorySerial: row.inventory_serial || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedActionId(null);
    setSelectedRowIds([]);
    setActiveEditField(null);
    setEditForm({
      name: '',
      email: '',
      building: '',
      office: '',
      inventorySerial: '',
    });
  };

  const saveEdit = async (id) => {
    if (!isAdmin) return;

    try {
      const currentRow = data.find((row) => row.id === id);
      const previousBuilding = String(currentRow?.building || '').trim();
      const nextBuilding = String(editForm.building || '').trim();
      const previousBuildingCount = data.filter(
        (row) => String(row.building || '').trim() === previousBuilding
      ).length;
      const shouldReturnToBuildings =
        (selectedSection === 'buildingDetails' || selectedSection === 'officeDetails') &&
        previousBuilding &&
        selectedBuilding === previousBuilding &&
        previousBuilding !== nextBuilding &&
        previousBuildingCount === 1;

      const response = await api.put(`/update/${id}`, editForm);
      if (response.data?.row) {
        setData((currentData) =>
          currentData.map((row) => (row.id === id ? response.data.row : row))
        );
      }
      await fetchData();
      cancelEdit();
      if (shouldReturnToBuildings) {
        setSelectedBuilding('');
        setSelectedOffice('');
        setSelectedSection('buildings');
      }
      alert('השינויים נשמרו בהצלחה!');
    } catch (err) {
      alert('שגיאה: ' + (err.response?.data?.error || err.message));
    }
  };

  const renderEditableCell = (row, field, fallback = '-', rowValue = row[field]) => {
    if (editingId !== row.id) {
      return rowValue || fallback;
    }

    if (activeEditField === field) {
      return (
        <input
          type={field === 'email' ? 'email' : 'text'}
          name={field}
          value={editForm[field]}
          onChange={handleEditChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveEdit(row.id);
            }

            if (e.key === 'Escape') {
              setActiveEditField(null);
            }
          }}
          className={`table-edit-input ${field === 'office' ? 'table-edit-input-office' : ''} ${
            field === 'inventorySerial' ? 'table-edit-input-inventory' : ''
          }`}
          autoFocus
        />
      );
    }

    return (
      <button
        type="button"
        className="table-edit-value"
        onClick={() => setActiveEditField(field)}
      >
        {editForm[field] || fallback}
      </button>
    );
  };

  const openOfficeDetails = (row) => {
    const office = String(row.office || '').trim();
    if (!office) return;

    setSelectedBuilding(String(row.building || selectedBuilding || '').trim());
    setSelectedOffice(office);
    setSelectedSection('officeDetails');
  };

  const openItemHistory = async (row) => {
    setHistoryItem(row);
    setHistoryRows([]);
    setHistoryBackSection(selectedSection);
    setSelectedSection('itemHistory');

    try {
      setHistoryLoading(true);
      const response = await api.get(`/history/${row.id}`);
      setHistoryRows(response.data);
    } catch (err) {
      alert('שגיאה בטעינת היסטוריה: ' + (err.response?.data?.error || err.message));
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderSerialCell = (row) => {
    if (!row.serial_number) return '-';

    return (
      <button type="button" className="history-link-button" onClick={() => openItemHistory(row)}>
        {row.serial_number}
      </button>
    );
  };

  const renderInventorySerialCell = (row) => {
    if (row.category !== 'computer') return '-';

    if (editingId === row.id) {
      return renderEditableCell(row, 'inventorySerial', '-', row.inventory_serial);
    }

    if (!row.inventory_serial) return '-';

    return (
      <button type="button" className="history-link-button" onClick={() => openItemHistory(row)}>
        {row.inventory_serial}
      </button>
    );
  };

  const getHistoryDisplayRows = () => {
    const updatedRows = historyRows.map((row) => ({
      ...row,
      displayId: `${row.id}-updated`,
      rowType: 'updated',
    }));

    const oldestChange = historyRows[historyRows.length - 1];
    if (!oldestChange) return updatedRows;

    return [
      ...updatedRows,
      {
        ...oldestChange,
        displayId: `${oldestChange.id}-original`,
        name: oldestChange.previous_name || historyItem?.name,
        email: oldestChange.previous_email || historyItem?.email,
        building: oldestChange.previous_building || historyItem?.building,
        office: oldestChange.previous_office || historyItem?.office,
        category: oldestChange.previous_category || historyItem?.category,
        manufacturer: oldestChange.previous_manufacturer || historyItem?.manufacturer,
        model: oldestChange.previous_model || historyItem?.model,
        color: oldestChange.previous_color || historyItem?.color,
        storage: oldestChange.previous_storage || historyItem?.storage,
        serial_number: oldestChange.previous_serial_number || oldestChange.serial_number,
        inventory_serial:
          oldestChange.previous_inventory_serial || oldestChange.inventory_serial,
        rowType: 'original',
      },
    ];
  };

  const renderOfficeCell = (row) => {
    if (editingId === row.id) {
      return renderEditableCell(row, 'office');
    }

    if (!row.office) return '-';

    return (
      <button type="button" className="office-link-button" onClick={() => openOfficeDetails(row)}>
        {row.office}
      </button>
    );
  };

  const toggleRowActions = (rowId) => {
    if (!isAdmin) return;

    setSelectedRowIds((currentIds) => {
      const nextIds = currentIds.includes(rowId)
        ? currentIds.filter((id) => id !== rowId)
        : [...currentIds, rowId];

      setSelectedActionId(nextIds.length === 1 ? nextIds[0] : null);
      return nextIds;
    });

    if (selectedActionId === rowId && selectedRowIds.length === 1) {
      if (editingId === rowId) {
        cancelEdit();
      }
      return;
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipment-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('שגיאה בייצוא: ' + err.message);
    }
  };

  const handleSelectedExport = async (exportType) => {
    if (selectedRowIds.length < 2) return;

    try {
      const response = await api.post(
        '/export-selected',
        { ids: selectedRowIds, exportType },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('שגיאה בייצוא: ' + (err.response?.data?.error || err.message));
    }
  };

  const renderBulkActions = () =>
    selectedRowIds.length > 1 ? (
      <div className="bulk-actions-menu">
        <span>{selectedRowIds.length} רשומות נבחרו</span>
        <button type="button" className="btn btn-secondary" onClick={() => handleSelectedExport('audit')}>
          ביקורת
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => handleSelectedExport('travel')}>
          טופס טיולים
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setSelectedRowIds([])}>
          ניקוי
        </button>
      </div>
    ) : null;

  const handleDelete = async (id) => {
    if (!isAdmin) return;

    if (window.confirm('האם אתה בטוח שתרצה למחוק את הרשומה?')) {
      try {
        await api.delete(`/delete/${id}`);
        alert('נמחק בהצלחה!');
        fetchData();
      } catch (err) {
        alert('שגיאה: ' + err.message);
      }
    }
  };

  if (!auth) {
    return (
      <div className="login-page">
        <section className="login-card">
          <h1>מערכת ניהול ציוד</h1>
          <p>התחבר כדי להמשיך</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>שם משתמש:</label>
              <input
                type="text"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label>סיסמה:</label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                autoComplete="current-password"
                required
              />
            </div>

            {loginError && <p className="error-message">{loginError}</p>}

            <button type="submit" className="btn btn-primary">
              התחבר
            </button>
          </form>
        </section>
      </div>
    );
  }

  if (!selectedSection) {
    return (
      <div className="app-container">
        <header className="header">
          <div>
            <h1>מערכת ניהול ציוד</h1>
            <p>בחר אזור עבודה</p>
          </div>

          <div className="user-panel">
            <span>{auth.user.username}</span>
            <strong>{isAdmin ? 'admin' : 'viewer'}</strong>
            <button type="button" onClick={handleLogout} className="btn btn-secondary">
              יציאה
            </button>
          </div>
        </header>

        <section className="section-menu">
          <button
            type="button"
            className="section-button"
            onClick={() => setSelectedSection('newEquipment')}
          >
            ציוד חדש
          </button>
          <button
            type="button"
            className="section-button"
            onClick={() => setSelectedSection('buildings')}
          >
            מבנים
          </button>
          <button
            type="button"
            className="section-button"
            onClick={() => setSelectedSection('general')}
          >
            כללי
          </button>
        </section>
      </div>
    );
  }

  if (selectedSection === 'buildings') {
    return (
      <div className="app-container">
        <header className="header">
          <div>
            <h1>מבנים</h1>
            <p>ניהול מבנים</p>
          </div>

          <div className="user-panel">
            <button
              type="button"
              onClick={() => setSelectedSection('')}
              className="btn btn-secondary"
            >
              חזרה
            </button>
            <button type="button" onClick={handleLogout} className="btn btn-secondary">
              יציאה
            </button>
          </div>
        </header>

        <section className="placeholder-section">
          <h2>מבנים</h2>
          {loading ? (
            <p>טוען מבנים...</p>
          ) : buildings.length === 0 ? (
            <p>אין מבנים עדיין.</p>
          ) : (
            <div className="buildings-grid">
              {buildings.map((building) => (
                <button
                  type="button"
                  className="building-button"
                  key={building}
                  onClick={() => {
                    setBuildingSearchTerm('');
                    setSelectedBuilding(building);
                    setSelectedSection('buildingDetails');
                  }}
                >
                  {building}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="placeholder-section legacy-placeholder">
          <h2>מבנים</h2>
          <p>כאן נוסיף את ניהול המבנים בהמשך.</p>
        </section>
      </div>
    );
  }

  if (selectedSection === 'buildingDetails') {
    return (
      <div className="app-container">
        <header className="header">
          <div>
            <h1>{selectedBuilding ? `מבנה ${selectedBuilding}` : 'מבנה'}</h1>
            <p>רשומות ציוד לפי מבנה</p>
          </div>

          <div className="user-panel">
            <button
              type="button"
              onClick={() => setSelectedSection('buildings')}
              className="btn btn-secondary"
            >
              חזרה למבנים
            </button>
            <button type="button" onClick={handleLogout} className="btn btn-secondary">
              יציאה
            </button>
          </div>
        </header>

        <section className="table-section building-details-section">
          <div className="table-header">
            <h2>הנתונים של מבנה {selectedBuilding} ({selectedBuildingRows.length})</h2>
            <input
              type="search"
              className="search-input"
              placeholder="חיפוש לפי שם עובד או email"
              value={buildingSearchTerm}
              onChange={(e) => setBuildingSearchTerm(e.target.value)}
            />
          </div>
          {renderBulkActions()}

          {loading ? (
            <p>טוען נתונים...</p>
          ) : selectedBuildingRows.length === 0 ? (
            <p>אין רשומות למבנה הזה.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {isAdmin && <th className="select-column"></th>}
                    <th>שם עובד</th>
                    <th>דוא"ל</th>
                    <th>מבנה</th>
                    <th>משרד</th>
                    <th>קטגוריה</th>
                    <th>יצרן</th>
                    <th>דגם</th>
                    <th>צבע</th>
                    <th>מקום</th>
                    <th>סיריאל</th>
                    <th>סיריאל אינוונטר</th>
                    <th>תאריך</th>
                    {isAdmin && <th className="actions-column">פעולות</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedBuildingRows.map((row) => (
                    <tr key={row.id}>
                      {isAdmin && (
                        <td className="select-column">
                          <input
                            type="checkbox"
                            checked={selectedRowIds.includes(row.id)}
                            onChange={() => toggleRowActions(row.id)}
                            className="row-action-checkbox"
                            aria-label="בחר פעולות לרשומה"
                          />
                        </td>
                      )}
                      <td className="name-cell" title={row.name || ''}>
                        {renderEditableCell(row, 'name')}
                      </td>
                      <td className="email-cell" title={row.email || ''}>
                        <span className="email-cell-content">{renderEditableCell(row, 'email')}</span>
                      </td>
                      <td>{renderEditableCell(row, 'building', selectedBuilding || '-')}</td>
                      <td>{renderOfficeCell(row)}</td>
                      <td>{row.category === 'computer' ? 'מחשב' : 'פלאפון'}</td>
                      <td>{row.manufacturer || '-'}</td>
                      <td>{row.model || '-'}</td>
                      <td>{row.color || '-'}</td>
                      <td>{row.storage || '-'}</td>
                      <td>{renderSerialCell(row)}</td>
                      <td>{renderInventorySerialCell(row)}</td>
                      <td>{new Date(row.created_at).toLocaleDateString('he-IL')}</td>
                      {isAdmin && (
                        <td className="table-actions">
                          {editingId === row.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(row.id)}
                                className="btn btn-confirm"
                              >
                                אישור
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="btn btn-secondary"
                              >
                                ביטול
                              </button>
                            </>
                          ) : selectedActionId === row.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                className="btn btn-edit"
                              >
                                עריכה
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row.id)}
                                className="btn btn-delete"
                              >
                                מחק
                              </button>
                            </>
                          ) : (
                            <span className="empty-actions">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (selectedSection === 'officeDetails') {
    return (
      <div className="app-container">
        <header className="header">
          <div>
            <h1>משרד {selectedOffice}</h1>
            <p>{selectedBuilding ? `ציוד במבנה ${selectedBuilding}` : 'ציוד לפי משרד'}</p>
          </div>

          <div className="user-panel">
            <button
              type="button"
              onClick={() => setSelectedSection(selectedBuilding ? 'buildingDetails' : 'general')}
              className="btn btn-secondary"
            >
              חזרה
            </button>
            <button type="button" onClick={handleLogout} className="btn btn-secondary">
              יציאה
            </button>
          </div>
        </header>

        <section className="table-section building-details-section">
          <div className="table-header">
            <h2>הציוד במשרד {selectedOffice} ({selectedOfficeRows.length})</h2>
          </div>
          {renderBulkActions()}

          {loading ? (
            <p>טוען נתונים...</p>
          ) : selectedOfficeRows.length === 0 ? (
            <p>אין ציוד במשרד הזה.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {isAdmin && <th className="select-column"></th>}
                    <th>שם עובד</th>
                    <th>דוא"ל</th>
                    <th>מבנה</th>
                    <th>משרד</th>
                    <th>קטגוריה</th>
                    <th>יצרן</th>
                    <th>דגם</th>
                    <th>צבע</th>
                    <th>מקום</th>
                    <th>סיריאל</th>
                    <th>סיריאל אינוונטר</th>
                    <th>תאריך</th>
                    {isAdmin && <th className="actions-column">פעולות</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedOfficeRows.map((row) => (
                    <tr key={row.id}>
                      {isAdmin && (
                        <td className="select-column">
                          <input
                            type="checkbox"
                            checked={selectedRowIds.includes(row.id)}
                            onChange={() => toggleRowActions(row.id)}
                            className="row-action-checkbox"
                            aria-label="בחר פעולות לרשומה"
                          />
                        </td>
                      )}
                      <td className="name-cell" title={row.name || ''}>
                        {renderEditableCell(row, 'name')}
                      </td>
                      <td className="email-cell" title={row.email || ''}>
                        <span className="email-cell-content">{renderEditableCell(row, 'email')}</span>
                      </td>
                      <td>{renderEditableCell(row, 'building')}</td>
                      <td>{renderOfficeCell(row)}</td>
                      <td>{row.category === 'computer' ? 'מחשב' : 'פלאפון'}</td>
                      <td>{row.manufacturer || '-'}</td>
                      <td>{row.model || '-'}</td>
                      <td>{row.color || '-'}</td>
                      <td>{row.storage || '-'}</td>
                      <td>{renderSerialCell(row)}</td>
                      <td>{renderInventorySerialCell(row)}</td>
                      <td>{new Date(row.created_at).toLocaleDateString('he-IL')}</td>
                      {isAdmin && (
                        <td className="table-actions">
                          {editingId === row.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(row.id)}
                                className="btn btn-confirm"
                              >
                                אישור
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="btn btn-secondary"
                              >
                                ביטול
                              </button>
                            </>
                          ) : selectedActionId === row.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                className="btn btn-edit"
                              >
                                עריכה
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row.id)}
                                className="btn btn-delete"
                              >
                                מחק
                              </button>
                            </>
                          ) : (
                            <span className="empty-actions">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="table-section accessory-section">
          <div className="table-header">
            <h2>ציוד נלווה במשרד {selectedOffice} ({selectedOfficeAccessories.length})</h2>
          </div>

          {isAdmin && (
            <form className="accessory-form" onSubmit={handleAccessorySubmit}>
              <div className="form-group">
                <label>סוג ציוד:</label>
                <select
                  name="type"
                  value={accessoryForm.type}
                  onChange={handleAccessoryChange}
                >
                  <option value="monitor">מסך</option>
                  <option value="printer">מדפסת</option>
                  <option value="dockingStation">תחנת עגינה</option>
                </select>
              </div>

              {isMonitorAccessory && (
                <div className="form-group">
                  <label>גודל:</label>
                  <select
                    name="size"
                    value={accessoryForm.size}
                    onChange={handleAccessoryChange}
                  >
                    <option value="24">24</option>
                    <option value="27">27</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>יצרן:</label>
                <input
                  type="text"
                  name="manufacturer"
                  placeholder="הזן יצרן"
                  value={accessoryForm.manufacturer}
                  onChange={handleAccessoryChange}
                  required
                />
              </div>

              {isPrinterAccessory && (
                <div className="form-group">
                  <label>דגם:</label>
                  <input
                    type="text"
                    name="model"
                    placeholder="הזן דגם"
                    value={accessoryForm.model}
                    onChange={handleAccessoryChange}
                    required
                  />
                </div>
              )}

              {showAccessorySerialFields && (
                <>
                  <div className="form-group">
                    <label>סיריאל:</label>
                    <input
                      type="text"
                      name="serialNumber"
                      placeholder="הזן סיריאל"
                      value={accessoryForm.serialNumber}
                      onChange={handleAccessoryChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>סיריאל אינוונטר:</label>
                    <input
                      type="text"
                      name="inventorySerial"
                      placeholder="הזן סיריאל אינוונטר"
                      value={accessoryForm.inventorySerial}
                      onChange={handleAccessoryChange}
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary accessory-submit">
                הוסף ציוד נלווה
              </button>
            </form>
          )}

          {selectedOfficeAccessories.length === 0 ? (
            <p>אין ציוד נלווה במשרד הזה.</p>
          ) : (
            <div className="accessory-list">
              {selectedOfficeAccessories.map((item) => (
                <div className="accessory-item" key={item.id}>
                  <div className="accessory-detail accessory-type">
                    <span>סוג</span>
                    <strong>{accessoryTypeLabels[item.type] || item.type}</strong>
                  </div>

                  <div className="accessory-detail">
                    <span>יצרן</span>
                    <strong>{item.manufacturer || '-'}</strong>
                  </div>

                  {item.type === 'printer' && (
                    <div className="accessory-detail">
                      <span>דגם</span>
                      <strong>{item.model || '-'}</strong>
                    </div>
                  )}

                  {item.type === 'monitor' && (
                    <div className="accessory-detail">
                      <span>גודל</span>
                      <strong>{item.size ? `${item.size} אינץ׳` : '-'}</strong>
                    </div>
                  )}

                  {(item.type === 'monitor' || item.type === 'dockingStation') && (
                    <>
                      <div className="accessory-detail">
                        <span>סיריאל</span>
                        <strong>{item.serial_number || '-'}</strong>
                      </div>

                      <div className="accessory-detail">
                        <span>סיריאל אינוונטר</span>
                        <strong>{item.inventory_serial || '-'}</strong>
                      </div>
                    </>
                  )}

                  <div className="accessory-detail accessory-date">
                    <span>תאריך</span>
                    <strong>{new Date(item.created_at).toLocaleDateString('he-IL')}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (selectedSection === 'itemHistory') {
    return (
      <div className="app-container">
        <header className="header">
          <div>
            <h1>היסטוריית פריט</h1>
            <p>
              סיריאל: {historyItem?.serial_number || '-'} | סיריאל אינוונטר:{' '}
              {historyItem?.inventory_serial || '-'}
            </p>
          </div>

          <div className="user-panel">
            <button
              type="button"
              onClick={() => setSelectedSection(historyBackSection || 'general')}
              className="btn btn-secondary"
            >
              חזרה
            </button>
            <button type="button" onClick={handleLogout} className="btn btn-secondary">
              יציאה
            </button>
          </div>
        </header>

        <section className="table-section">
          <div className="table-header">
            <h2>שינויים בפריט ({historyRows.length})</h2>
          </div>

          {historyLoading ? (
            <p>טוען היסטוריה...</p>
          ) : historyRows.length === 0 ? (
            <p>אין היסטוריה לפריט הזה עדיין.</p>
          ) : (
            <div className="table-wrapper history-table-wrapper">
              <table className="history-table">
                <colgroup>
                  <col className="history-date-col" />
                  <col className="history-name-col" />
                  <col className="history-email-col" />
                  <col className="history-building-col" />
                  <col className="history-office-col" />
                  <col className="history-category-col" />
                  <col className="history-manufacturer-col" />
                  <col className="history-model-col" />
                  <col className="history-color-col" />
                  <col className="history-storage-col" />
                  <col className="history-serial-col" />
                  <col className="history-inventory-col" />
                  <col className="history-user-col" />
                </colgroup>
                <thead>
                  <tr>
                    <th>תאריך</th>
                    <th>שם עובד</th>
                    <th>דוא"ל</th>
                    <th>מבנה</th>
                    <th>משרד</th>
                    <th>קטגוריה</th>
                    <th>יצרן</th>
                    <th>דגם</th>
                    <th>צבע</th>
                    <th>מקום</th>
                    <th>סיריאל</th>
                    <th>סיריאל אינוונטר</th>
                    <th>בוצע ע"י</th>
                  </tr>
                </thead>
                <tbody>
                  {getHistoryDisplayRows().map((row) => (
                    <tr key={row.displayId}>
                      <td>{new Date(row.created_at).toLocaleString('he-IL')}</td>
                      <td className="history-name-cell">{row.name || historyItem?.name || '-'}</td>
                      <td className="history-email-cell" title={row.email || historyItem?.email || ''}>
                        <span className="email-cell-content">
                          {row.email || historyItem?.email || '-'}
                        </span>
                      </td>
                      <td>{row.building || historyItem?.building || '-'}</td>
                      <td>{row.office || historyItem?.office || '-'}</td>
                      <td>
                        {(row.category || historyItem?.category) === 'computer'
                          ? 'מחשב'
                          : (row.category || historyItem?.category) === 'phone'
                            ? 'פלאפון'
                            : '-'}
                      </td>
                      <td>{row.manufacturer || historyItem?.manufacturer || '-'}</td>
                      <td>{row.model || historyItem?.model || '-'}</td>
                      <td>{row.color || historyItem?.color || '-'}</td>
                      <td>{row.storage || historyItem?.storage || '-'}</td>
                      <td>{row.serial_number || '-'}</td>
                      <td>{row.inventory_serial || '-'}</td>
                      <td>{row.changed_by || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>מערכת ניהול ציוד</h1>
          <p>ניהול ציוד עובדים וייצוא ל-Excel</p>
        </div>

        <div className="user-panel">
          <button
            type="button"
            onClick={() => setSelectedSection('')}
            className="btn btn-secondary"
          >
            חזרה
          </button>
          <span>{auth.user.username}</span>
          <strong>{isAdmin ? 'admin' : 'viewer'}</strong>
          <button type="button" onClick={handleLogout} className="btn btn-secondary">
            יציאה
          </button>
        </div>
      </header>

      <div className={selectedSection === 'newEquipment' ? 'main-content new-equipment-content' : 'main-content'}>
        {showEquipmentForm && (
          <section className="form-section">
            <h2>הזנת מידע</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>שם עובד:</label>
                <input
                  type="text"
                  name="name"
                  placeholder="הזן שם עובד"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>דוא"ל:</label>
                <input
                  type="email"
                  name="email"
                  placeholder="הזן דוא״ל"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>מבנה:</label>
                <input
                  type="text"
                  name="building"
                  placeholder="הזן מבנה"
                  value={form.building}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>משרד:</label>
                <input
                  type="text"
                  name="office"
                  placeholder="הזן משרד"
                  value={form.office}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>קטגוריה:</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="computer">מחשב</option>
                  <option value="phone">פלאפון</option>
                </select>
              </div>

              <div className="form-group">
                <label>מקום:</label>
                <select name="storage" value={form.storage} onChange={handleChange}>
                  {isComputer ? (
                    <>
                      <option value="512GB">512GB</option>
                      <option value="1T">1T</option>
                    </>
                  ) : (
                    <>
                      <option value="256GB">256GB</option>
                      <option value="512GB">512GB</option>
                    </>
                  )}
                </select>
              </div>

              <div className="equipment-fields">
                <div className="form-group">
                  <label>יצרן:</label>
                  <input
                    type="text"
                    name="manufacturer"
                    placeholder="הזן יצרן"
                    value={form.manufacturer}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>דגם:</label>
                  <input
                    type="text"
                    name="model"
                    placeholder="הזן דגם"
                    value={form.model}
                    onChange={handleChange}
                    required
                  />
                </div>

                {isPhone && (
                  <div className="form-group">
                    <label>צבע:</label>
                    <input
                      type="text"
                      name="color"
                      placeholder="הזן צבע"
                      value={form.color}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>סיריאל:</label>
                  <input
                    type="text"
                    name="serialNumber"
                    placeholder="הזן סיריאל"
                    value={form.serialNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                {isComputer && (
                  <div className="form-group">
                    <label>סיריאל אינוונטר:</label>
                    <input
                      type="text"
                      name="inventorySerial"
                      placeholder="הזן סיריאל אינוונטר"
                      value={form.inventorySerial}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary">
                שמור מידע
              </button>
            </form>
          </section>
        )}

        {showDataTable && (
          <>
            <section className="export-section viewer-export">
              <button onClick={handleExport} className="btn btn-export">
                ייצא ל-Excel
              </button>
            </section>

            <section className="table-section">
              <div className="table-header">
                <h2>הנתונים השמורים ({filteredData.length})</h2>
                <input
                  type="search"
                  className="search-input"
                  placeholder="חיפוש לפי שם או מילת מפתח"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {renderBulkActions()}

              {loading ? (
                <p>טוען נתונים...</p>
              ) : filteredData.length === 0 ? (
                <p>אין נתונים עדיין.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        {isAdmin && <th className="select-column"></th>}
                        <th>שם עובד</th>
                        <th>דוא"ל</th>
                        <th>מבנה</th>
                        <th>משרד</th>
                        <th>קטגוריה</th>
                        <th>יצרן</th>
                        <th>דגם</th>
                        <th>צבע</th>
                        <th>מקום</th>
                        <th>סיריאל</th>
                        <th>סיריאל אינוונטר</th>
                        <th>תאריך</th>
                        {isAdmin && <th className="actions-column">פעולות</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row) => (
                        <tr key={row.id}>
                          {isAdmin && (
                            <td className="select-column">
                              <input
                                type="checkbox"
                                checked={selectedRowIds.includes(row.id)}
                                onChange={() => toggleRowActions(row.id)}
                                className="row-action-checkbox"
                                aria-label="בחר פעולות לרשומה"
                              />
                            </td>
                          )}
                          <td className="name-cell" title={row.name || ''}>
                            {renderEditableCell(row, 'name')}
                          </td>
                          <td className="email-cell" title={row.email || ''}>
                            <span className="email-cell-content">{renderEditableCell(row, 'email')}</span>
                          </td>
                          <td>{renderEditableCell(row, 'building')}</td>
                          <td>{renderOfficeCell(row)}</td>
                          <td>{row.category === 'computer' ? 'מחשב' : 'פלאפון'}</td>
                          <td>{row.manufacturer || '-'}</td>
                          <td>{row.model || '-'}</td>
                          <td>{row.color || '-'}</td>
                          <td>{row.storage || '-'}</td>
                          <td>{renderSerialCell(row)}</td>
                          <td>{renderInventorySerialCell(row)}</td>
                          <td>{new Date(row.created_at).toLocaleDateString('he-IL')}</td>
                          {isAdmin && (
                            <td className="table-actions">
                              {editingId === row.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => saveEdit(row.id)}
                                    className="btn btn-confirm"
                                  >
                                    אישור
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="btn btn-secondary"
                                  >
                                    ביטול
                                  </button>
                                </>
                              ) : selectedActionId === row.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(row)}
                                    className="btn btn-edit"
                                  >
                                    עריכה
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(row.id)}
                                    className="btn btn-delete"
                                  >
                                    מחק
                                  </button>
                                </>
                              ) : (
                                <span className="empty-actions">-</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
