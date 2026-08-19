import GlobalFeedback from './GlobalFeedback';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import PageHeader from './PageHeader';
import StatusMessage from './StatusMessage';
import BulkActions from './BulkActions';
import EquipmentTable from './EquipmentTable';
import DetailsPanel from './DetailsPanel';
import EquipmentForm from './EquipmentForm';
import ExcelImportForm from './ExcelImportForm';

function EquipmentWorkspacePage({
  notification,
  onCloseNotification,
  deleteCandidateId,
  onCancelDelete,
  onConfirmDelete,
  onBack,
  username,
  role,
  onLogout,
  isNewEquipmentSection,
  showEquipmentForm,
  showDataTable,
  form,
  onFormChange,
  onFormSubmit,
  importFile,
  importLoading,
  importResult,
  onImportFileChange,
  onImportSubmit,
  statusFilter,
  onToggleStatusFilter,
  searchTerm,
  onSearchTermChange,
  selectedRowIds,
  onExportSelected,
  onClearSelectedRows,
  loading,
  rows,
  isAdmin,
  onToggleRow,
  onOpenOfficeDetails,
  detailsRow,
  onSelectDetails,
  detailsPanelProps,
  sortMode,
  onSortToggle,
}) {
  return (
    <div className="app-container">
      <GlobalFeedback notification={notification} onClose={onCloseNotification} />
      <DeleteConfirmDialog
        open={Boolean(deleteCandidateId)}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
      <PageHeader
        title="ניהול ציוד"
        subtitle="מעקב, שיוך ועדכון ציוד עובדים"
        onBack={onBack}
        username={username}
        role={role}
        onLogout={onLogout}
      />

      <div className={isNewEquipmentSection ? 'main-content new-equipment-content' : 'main-content'}>
        {showEquipmentForm && (
          <section className="form-section">
            <h2>הזנת מידע</h2>
            <EquipmentForm form={form} onChange={onFormChange} onSubmit={onFormSubmit} />
            <ExcelImportForm
              importFile={importFile}
              importLoading={importLoading}
              importResult={importResult}
              onFileChange={onImportFileChange}
              onSubmit={onImportSubmit}
            />
          </section>
        )}

        {showDataTable && (
          <section className="table-section">
            <div className="table-header">
              <div className="table-title-actions">
                <h2 aria-live="polite">הנתונים השמורים ({rows.length})</h2>
                <button type="button" className="btn btn-status-filter" onClick={onToggleStatusFilter}>
                  {statusFilter === 'active' ? 'ציוד גרוט' : 'ציוד פעיל'}
                </button>
              </div>
              <input
                aria-label="חיפוש נתונים שמורים"
                type="search"
                className="search-input"
                placeholder="חיפוש לפי שם, מייל, סיריאל או אינוונטר"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>
            <BulkActions selectedRowIds={selectedRowIds} onExport={onExportSelected} onClear={onClearSelectedRows} />

            {loading ? (
              <StatusMessage>טוען נתונים...</StatusMessage>
            ) : rows.length === 0 ? (
              <StatusMessage>אין נתונים עדיין.</StatusMessage>
            ) : (
              <EquipmentTable
                rows={rows}
                isAdmin={isAdmin}
                selectedRowIds={selectedRowIds}
                onToggleRow={onToggleRow}
                onOpenOfficeDetails={onOpenOfficeDetails}
                detailsRow={detailsRow}
                onSelectDetails={onSelectDetails}
                sortMode={sortMode}
                onSortToggle={onSortToggle}
              />
            )}
            <DetailsPanel detailsRow={detailsRow} isAdmin={isAdmin} {...detailsPanelProps} />
          </section>
        )}
      </div>
    </div>
  );
}

export default EquipmentWorkspacePage;
