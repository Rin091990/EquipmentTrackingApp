function BulkActions({ selectedRowIds, onExport, onClear }) {
  if (selectedRowIds.length <= 1) return null;

  return (
    <div className="bulk-actions-menu">
      <span>{selectedRowIds.length} רשומות נבחרו</span>
      <button type="button" className="btn btn-bulk-action" onClick={() => onExport('audit')}>
        ביקורת
      </button>
      <button type="button" className="btn btn-bulk-action" onClick={() => onExport('travel')}>
        טופס טיולים
      </button>
      <button type="button" className="btn btn-bulk-clear" onClick={onClear}>
        ניקוי
      </button>
    </div>
  );
}

export default BulkActions;
