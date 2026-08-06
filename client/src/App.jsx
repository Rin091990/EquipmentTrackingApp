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
  category: 'computer',
  manufacturer: '',
  model: '',
  color: '',
  storage: '512GB',
  serialNumber: '',
};

function App() {
  const [auth, setAuth] = useState(getSavedAuth);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

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
  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const rows = normalizedSearch
      ? data.filter((row) =>
          [row.name, row.email, row.category, row.manufacturer, row.model, row.serial_number]
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
    setSelectedSection('');
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

  useEffect(() => {
    if (auth?.token && selectedSection === 'general') {
      fetchData();
    }
  }, [auth?.token, fetchData, selectedSection]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'category') {
      setForm({
        ...form,
        category: value,
        storage: value === 'computer' ? '512GB' : '256GB',
        color: value === 'computer' ? '' : form.color,
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
            <h1>׳׳¢׳¨׳›׳× ׳ ׳™׳”׳•׳ ׳¦׳™׳•׳“</h1>
            <p>׳‘׳—׳¨ ׳׳–׳•׳¨ ׳¢׳‘׳•׳“׳”</p>
          </div>

          <div className="user-panel">
            <span>{auth.user.username}</span>
            <strong>{isAdmin ? 'admin' : 'viewer'}</strong>
            <button type="button" onClick={handleLogout} className="btn btn-secondary">
              ׳™׳¦׳™׳׳”
            </button>
          </div>
        </header>

        <section className="section-menu">
          <button
            type="button"
            className="section-button"
            onClick={() => setSelectedSection('general')}
          >
            כללי
          </button>
          <button
            type="button"
            className="section-button"
            onClick={() => setSelectedSection('buildings')}
          >
            מבנים
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
          <p>כאן נוסיף את ניהול המבנים בהמשך.</p>
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

      <div className="main-content">
        {isAdmin && (
          <section className="form-section">
            <h2>הזנת מידע חדש</h2>
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
              </div>

              <button type="submit" className="btn btn-primary">
                שמור מידע
              </button>
            </form>
          </section>
        )}

        <section className={isAdmin ? 'export-section' : 'export-section viewer-export'}>
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

          {loading ? (
            <p>טוען נתונים...</p>
          ) : filteredData.length === 0 ? (
            <p>אין נתונים עדיין.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>שם עובד</th>
                    <th>דוא"ל</th>
                    <th>קטגוריה</th>
                    <th>יצרן</th>
                    <th>דגם</th>
                    <th>צבע</th>
                    <th>מקום</th>
                    <th>סיריאל</th>
                    <th>תאריך</th>
                    {isAdmin && <th>פעולות</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.category === 'computer' ? 'מחשב' : 'פלאפון'}</td>
                      <td>{row.manufacturer || '-'}</td>
                      <td>{row.model || '-'}</td>
                      <td>{row.color || '-'}</td>
                      <td>{row.storage || '-'}</td>
                      <td>{row.serial_number || '-'}</td>
                      <td>{new Date(row.created_at).toLocaleDateString('he-IL')}</td>
                      {isAdmin && (
                        <td>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="btn btn-delete"
                          >
                            מחק
                          </button>
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
    </div>
  );
}

export default App;
