function ExcelImportForm({ importFile, importLoading, importResult, onFileChange, onSubmit }) {
  return (
    <form className="excel-import-section" onSubmit={onSubmit}>
      <h3>ייבוא מאקסל</h3>
      <p>הקובץ צריך לכלול כותרות כמו שם עובד, דוא"ל, מבנה, משרד, קטגוריה, יצרן, דגם, אחסון, סיריאל ואינוונטר.</p>

      <div className="excel-import-controls">
        <input
          aria-label="בחר קובץ Excel לייבוא"
          type="file"
          accept=".xlsx,.xls"
          onChange={onFileChange}
        />
        <button type="submit" className="btn btn-primary" disabled={!importFile || importLoading}>
          {importLoading ? 'מייבא...' : 'ייבא Excel'}
        </button>
      </div>

      {importResult && (
        <div
          className="import-result"
          role={importResult.errors?.length > 0 ? 'alert' : 'status'}
          aria-live={importResult.errors?.length > 0 ? 'assertive' : 'polite'}
        >
          <strong>
            יובאו {importResult.importedCount || 0} רשומות
            {typeof importResult.failedCount === 'number' ? `, ${importResult.failedCount} נכשלו` : ''}
          </strong>
          {importResult.errors?.length > 0 && (
            <ul>
              {importResult.errors.slice(0, 5).map((item) => (
                <li key={`${item.row}-${item.error}`}>
                  שורה {item.row}: {item.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}

export default ExcelImportForm;
