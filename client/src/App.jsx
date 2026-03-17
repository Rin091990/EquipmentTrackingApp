import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'sales',
    amount: ''
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/data');
      setData(response.data);
    } catch (err) {
      console.error('שגיאה בטעינת נתונים:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/submit', form);
      alert('✅ המידע נשמר בהצלחה!');
      setForm({ name: '', email: '', category: 'sales', amount: '' });
      fetchData();
    } catch (err) {
      alert('❌ שגיאה: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/export', {
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
        await axios.delete(`http://localhost:5000/api/delete/${id}`);
        alert('✅ נמחק בהצלחה!');
        fetchData();
      } catch (err) {
        alert('❌ שגיאה: ' + err.message);
      }
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>📝 מערכת ניהול ציוד</h1>
        <p>הזן מידע, שמור לבסיס הנתונים, וייצא ל-Excel</p>
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