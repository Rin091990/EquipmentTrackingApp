import GlobalFeedback from './GlobalFeedback';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import PageHeader from './PageHeader';
import StatusMessage from './StatusMessage';
import BulkActions from './BulkActions';
import EquipmentTable from './EquipmentTable';
import DetailsPanel from './DetailsPanel';

function BuildingDetailsPage({
  notification,
  onCloseNotification,
  deleteCandidateId,
  onCancelDelete,
  onConfirmDelete,
  selectedBuilding,
  onBack,
  onLogout,
  buildingSearchTerm,
  onBuildingSearchTermChange,
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
        title={selectedBuilding ? `מבנה ${selectedBuilding}` : 'מבנה'}
        subtitle="רשומות ציוד לפי מבנה"
        backLabel="חזרה למבנים"
        onBack={onBack}
        onLogout={onLogout}
      />

      <section className="table-section building-details-section">
        <div className="table-header">
          <h2 aria-live="polite">
            הנתונים של מבנה {selectedBuilding} ({rows.length})
          </h2>
          <input
            aria-label="חיפוש רשומות במבנה"
            type="search"
            className="search-input"
            placeholder="חיפוש לפי שם עובד או email"
            value={buildingSearchTerm}
            onChange={(e) => onBuildingSearchTermChange(e.target.value)}
          />
        </div>
        <BulkActions selectedRowIds={selectedRowIds} onExport={onExportSelected} onClear={onClearSelectedRows} />

        {loading ? (
          <StatusMessage>טוען נתונים...</StatusMessage>
        ) : rows.length === 0 ? (
          <StatusMessage>אין רשומות למבנה הזה.</StatusMessage>
        ) : (
          <EquipmentTable
            rows={rows}
            isAdmin={isAdmin}
            selectedRowIds={selectedRowIds}
            onToggleRow={onToggleRow}
            onOpenOfficeDetails={onOpenOfficeDetails}
            detailsRow={detailsRow}
            onSelectDetails={onSelectDetails}
            buildingFallback={selectedBuilding || '-'}
            sortMode={sortMode}
            onSortToggle={onSortToggle}
          />
        )}
        <DetailsPanel detailsRow={detailsRow} isAdmin={isAdmin} {...detailsPanelProps} />
      </section>
    </div>
  );
}

export default BuildingDetailsPage;
