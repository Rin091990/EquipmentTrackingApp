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

function App() {
  const [auth, setAuth] = useState(getSavedAuth);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'sales',
    amount: ''
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });

    if (auth?.token) {
      instance.defaults.headers.common.Authorization = `Bearer ${auth.token}`;
    }

    return instance;
  }, [auth]);

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
    if (auth?.token) {
      fetchData();
    }
  }, [auth?.token, fetchData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/submit', form);
      alert('✅ המידע נשמר בהצלחה!');
      setForm({ name: '', email: '', category: 'sales', amount: '' });
      fetchData();
    } catch (err) {
      alert('❌ שגיאה: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/export', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ שגיאה בייצוא: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('האם אתה בטוח שתרצה למחוק את הרשומה?')) {
      try {
        await api.delete(`/delete/${id}`);
        alert('✅ נמחק בהצלחה!');
        fetchData();
      } catch (err) {
        alert('❌ שגיאה: ' + err.message);
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

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>📝 מערכת ניהול ציוד</h1>
          <p>הזן מידע, שמור לבסיס הנתונים, וייצא ל-Excel</p>
        </div>

        <div className="user-panel">
          <span>{auth.user.username}</span>
          <strong>{auth.user.role}</strong>
          <button type="button" onClick={handleLogout} className="btn btn-secondary">
            יציאה
          </button>
        </div>
      </header>

      <div className="main-content">
        <section className="form-section">
          <h2>➕ הזנת מידע חדש</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>שם:</label>
              <input
                type="text"
                name="name"
                placeholder="הזן שם"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>דוא״ל:</label>
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
                <option value="sales">מכירות</option>
                <option value="support">תמיכה</option>
                <option value="billing">חיוב</option>
                <option value="other">אחר</option>
              </select>
            </div>

            <div className="form-group">
              <label>סכום:</label>
              <input
                type="number"
                name="amount"
                placeholder="הזן סכום"
                value={form.amount}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              💾 שמור מידע
            </button>
          </form>
        </section>

        <section className="export-section">
          <button onClick={handleExport} className="btn btn-export">
            📥 ייצא ל-Excel
          </button>
        </section>

        <section className="table-section">
          <h2>📊 הנתונים השמורים ({data.length})</h2>
          
          {loading ? (
            <p>⏳ טוען נתונים...</p>
          ) : data.length === 0 ? (
            <p>אין נתונים עדיין. התחל בהזנת מידע!</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>דוא״ל</th>
                    <th>קטגוריה</th>
                    <th>סכום</th>
                    <th>תאריך</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.category}</td>
                      <td>₪{parseFloat(row.amount).toFixed(2)}</td>
                      <td>{new Date(row.created_at).toLocaleDateString('he-IL')}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="btn btn-delete"
                        >
                          🗑️ מחק
                        </button>
                      </td>
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
