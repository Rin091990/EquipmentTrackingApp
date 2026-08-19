function DeleteConfirmDialog({ open, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation">
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <h2 id="delete-dialog-title">מחיקת רשומה</h2>
        <p id="delete-dialog-description">האם למחוק את הרשומה הזו?</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            ביטול
          </button>
          <button type="button" className="btn btn-delete" onClick={onConfirm}>
            מחק
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
