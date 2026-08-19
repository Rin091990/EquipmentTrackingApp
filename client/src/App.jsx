import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';
import { API_URL, emptyForm, emptyAccessoryForm, emptyEditForm } from './constants';
import LoginPage from './components/LoginPage';
import MenuPage from './components/MenuPage';
import BuildingsPage from './components/BuildingsPage';
import BuildingDetailsPage from './components/BuildingDetailsPage';
import OfficeDetailsPage from './components/OfficeDetailsPage';
import ItemHistoryPage from './components/ItemHistoryPage';
import EquipmentWorkspacePage from './components/EquipmentWorkspacePage';

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
  const [form, setForm] = useState(emptyForm);
  const [data, setData] = useState([]);
  const [officeAccessories, setOfficeAccessories] = useState([]);
  const [accessoryForm, setAccessoryForm] = useState(emptyAccessoryForm);
  const [historyItem, setHistoryItem] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyBackSection, setHistoryBackSection] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [buildingSearchTerm, setBuildingSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('date');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [detailsRow, setDetailsRow] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState(null);

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });

    if (auth?.token) {
      instance.defaults.headers.common.Authorization = `Bearer ${auth.token}`;
    }

    return instance;
  }, [auth]);

  const isAdmin = auth?.user?.role === 'admin';

  const showNotification = useCallback((message, tone = 'info') => {
    setNotification({ message, tone });
  }, []);

  const showEquipmentForm = isAdmin && selectedSection === 'newEquipment';
  const showDataTable = selectedSection === 'general';

  const sortRows = useCallback(
    (rows) => {
      const sortedRows = [...rows];

      if (sortMode === 'name') {
        return sortedRows.sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'he')
        );
      }

      if (sortMode === 'building') {
        return sortedRows.sort((a, b) => {
          const buildingCompare = String(a.building || '').localeCompare(
            String(b.building || ''),
            'he'
          );

          if (buildingCompare !== 0) return buildingCompare;

          return String(a.name || '').localeCompare(String(b.name || ''), 'he');
        });
      }

      return sortedRows.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    [sortMode]
  );

  const handleSortToggle = (mode) => {
    setSortMode((currentMode) => (currentMode === mode ? 'date' : mode));
  };

  const buildings = useMemo(() => {
    const names = data.map((row) => row.building?.trim()).filter(Boolean);

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

    return sortRows(filteredRows);
  }, [buildingSearchTerm, data, selectedBuilding, sortRows]);

  const selectedOfficeRows = useMemo(() => {
    if (!selectedOffice) return [];

    return sortRows(
      data.filter((row) => {
        const sameOffice = String(row.office || '').trim() === selectedOffice;
        const sameBuilding = selectedBuilding
          ? String(row.building || '').trim() === selectedBuilding
          : true;

        return sameOffice && sameBuilding;
      })
    );
  }, [data, selectedBuilding, selectedOffice, sortRows]);

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

    const rows = data.filter((row) => {
      const normalizedStatus = row.status === 'scrapped' ? 'scrapped' : 'active';
      const matchesStatus = normalizedStatus === statusFilter;
      const matchesGeneralSearch = normalizedSearch
        ? [
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
        : true;

      return matchesStatus && matchesGeneralSearch;
    });

    return sortRows(rows);
  }, [data, searchTerm, sortRows, statusFilter]);

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

  useEffect(() => {
    setDetailsRow(null);
  }, [selectedSection, selectedBuilding, selectedOffice]);

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
      showNotification('המידע נשמר בהצלחה!', 'success');
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      showNotification('שגיאה: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();

    if (!isAdmin || !importFile) return;

    try {
      setImportLoading(true);
      setImportResult(null);

      const fileBuffer = await importFile.arrayBuffer();
      const response = await api.post('/import-excel', fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-File-Name': encodeURIComponent(importFile.name),
        },
      });

      setImportResult(response.data);
      setImportFile(null);
      await fetchData();
      showNotification(response.data.message || 'הייבוא הסתיים בהצלחה', 'success');
    } catch (err) {
      const responseData = err.response?.data;
      setImportResult(responseData || null);
      showNotification('שגיאה בייבוא: ' + (responseData?.error || err.message), 'error');
    } finally {
      setImportLoading(false);
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
      showNotification('הציוד הנלווה נשמר בהצלחה!', 'success');
    } catch (err) {
      showNotification('שגיאה: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const startEdit = (row) => {
    if (!isAdmin) return;

    setSelectedActionId(row.id);
    setEditingId(row.id);
    setEditForm({
      name: row.name || '',
      email: row.email || '',
      building: row.building || '',
      office: row.office || '',
      status: row.status === 'scrapped' ? 'scrapped' : 'active',
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
    setEditForm(emptyEditForm);
  };

  useEffect(() => {
    if (!editingId || detailsRow?.id === editingId) return;

    setEditingId(null);
    setSelectedActionId(null);
    setSelectedRowIds([]);
    setEditForm(emptyEditForm);
  }, [detailsRow, editingId]);

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
        setDetailsRow((current) => (current?.id === id ? response.data.row : current));
      }
      await fetchData();
      cancelEdit();
      if (shouldReturnToBuildings) {
        setSelectedBuilding('');
        setSelectedOffice('');
        setSelectedSection('buildings');
      }
      showNotification('השינויים נשמרו בהצלחה!', 'success');
    } catch (err) {
      showNotification('שגיאה: ' + (err.response?.data?.error || err.message), 'error');
    }
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
      showNotification('שגיאה בטעינת היסטוריה: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setHistoryLoading(false);
    }
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
      showNotification('שגיאה בייצוא: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleEmployeeEquipmentExport = async (row) => {
    if (!row?.id) return;

    try {
      const response = await api.get(`/export-employee-equipment/${row.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee-equipment-${row.name || row.id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showNotification('שגיאה בהפקת טופס ציוד לעובד: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;

    setDeleteCandidateId(id);
  };

  const confirmDelete = async () => {
    if (!isAdmin || !deleteCandidateId) return;

    const id = deleteCandidateId;

    try {
      await api.delete(`/delete/${id}`);
      showNotification('נמחק בהצלחה!', 'success');
      setDetailsRow((current) => (current?.id === id ? null : current));
      setDeleteCandidateId(null);
      fetchData();
    } catch (err) {
      showNotification('שגיאה: ' + err.message, 'error');
    }
  };

  const closeNotification = () => setNotification(null);
  const cancelDeleteCandidate = () => setDeleteCandidateId(null);

  const detailsPanelProps = {
    editingId,
    editForm,
    onEditChange: handleEditChange,
    onClose: () => setDetailsRow(null),
    onSaveEdit: saveEdit,
    onCancelEdit: cancelEdit,
    onStartEdit: startEdit,
    onDelete: handleDelete,
    onOpenHistory: openItemHistory,
    onExportEmployee: handleEmployeeEquipmentExport,
  };

  const sharedDialogProps = {
    notification,
    onCloseNotification: closeNotification,
    deleteCandidateId,
    onCancelDelete: cancelDeleteCandidate,
    onConfirmDelete: confirmDelete,
  };

  if (!auth) {
    return (
      <LoginPage
        {...sharedDialogProps}
        loginForm={loginForm}
        loginError={loginError}
        onLoginChange={handleLoginChange}
        onLoginSubmit={handleLogin}
      />
    );
  }

  if (!selectedSection) {
    return (
      <MenuPage
        {...sharedDialogProps}
        username={auth.user.username}
        role={isAdmin ? 'admin' : 'viewer'}
        onLogout={handleLogout}
        onSelectSection={setSelectedSection}
      />
    );
  }

  if (selectedSection === 'buildings') {
    return (
      <BuildingsPage
        {...sharedDialogProps}
        onBack={() => setSelectedSection('')}
        onLogout={handleLogout}
        loading={loading}
        buildings={buildings}
        onSelectBuilding={(building) => {
          setBuildingSearchTerm('');
          setSelectedBuilding(building);
          setSelectedSection('buildingDetails');
        }}
      />
    );
  }

  if (selectedSection === 'buildingDetails') {
    return (
      <BuildingDetailsPage
        {...sharedDialogProps}
        selectedBuilding={selectedBuilding}
        onBack={() => setSelectedSection('buildings')}
        onLogout={handleLogout}
        buildingSearchTerm={buildingSearchTerm}
        onBuildingSearchTermChange={setBuildingSearchTerm}
        selectedRowIds={selectedRowIds}
        onExportSelected={handleSelectedExport}
        onClearSelectedRows={() => setSelectedRowIds([])}
        loading={loading}
        rows={selectedBuildingRows}
        isAdmin={isAdmin}
        onToggleRow={toggleRowActions}
        onOpenOfficeDetails={openOfficeDetails}
        detailsRow={detailsRow}
        onSelectDetails={setDetailsRow}
        detailsPanelProps={detailsPanelProps}
        sortMode={sortMode}
        onSortToggle={handleSortToggle}
      />
    );
  }

  if (selectedSection === 'officeDetails') {
    return (
      <OfficeDetailsPage
        {...sharedDialogProps}
        selectedBuilding={selectedBuilding}
        selectedOffice={selectedOffice}
        onBack={() => setSelectedSection(selectedBuilding ? 'buildingDetails' : 'general')}
        onLogout={handleLogout}
        selectedRowIds={selectedRowIds}
        onExportSelected={handleSelectedExport}
        onClearSelectedRows={() => setSelectedRowIds([])}
        loading={loading}
        rows={selectedOfficeRows}
        isAdmin={isAdmin}
        onToggleRow={toggleRowActions}
        onOpenOfficeDetails={openOfficeDetails}
        detailsRow={detailsRow}
        onSelectDetails={setDetailsRow}
        detailsPanelProps={detailsPanelProps}
        sortMode={sortMode}
        onSortToggle={handleSortToggle}
        accessories={selectedOfficeAccessories}
        accessoryForm={accessoryForm}
        onAccessoryChange={handleAccessoryChange}
        onAccessorySubmit={handleAccessorySubmit}
      />
    );
  }

  if (selectedSection === 'itemHistory') {
    return (
      <ItemHistoryPage
        {...sharedDialogProps}
        historyItem={historyItem}
        historyRows={historyRows}
        historyLoading={historyLoading}
        onBack={() => setSelectedSection(historyBackSection || 'general')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <EquipmentWorkspacePage
      {...sharedDialogProps}
      onBack={() => setSelectedSection('')}
      username={auth.user.username}
      role={isAdmin ? 'admin' : 'viewer'}
      onLogout={handleLogout}
      isNewEquipmentSection={selectedSection === 'newEquipment'}
      showEquipmentForm={showEquipmentForm}
      showDataTable={showDataTable}
      form={form}
      onFormChange={handleChange}
      onFormSubmit={handleSubmit}
      importFile={importFile}
      importLoading={importLoading}
      importResult={importResult}
      onImportFileChange={(e) => {
        setImportFile(e.target.files?.[0] || null);
        setImportResult(null);
      }}
      onImportSubmit={handleExcelImport}
      statusFilter={statusFilter}
      onToggleStatusFilter={() =>
        setStatusFilter((current) => (current === 'active' ? 'scrapped' : 'active'))
      }
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      selectedRowIds={selectedRowIds}
      onExportSelected={handleSelectedExport}
      onClearSelectedRows={() => setSelectedRowIds([])}
      loading={loading}
      rows={filteredData}
      isAdmin={isAdmin}
      onToggleRow={toggleRowActions}
      onOpenOfficeDetails={openOfficeDetails}
      detailsRow={detailsRow}
      onSelectDetails={setDetailsRow}
      detailsPanelProps={detailsPanelProps}
      sortMode={sortMode}
      onSortToggle={handleSortToggle}
    />
  );
}

export default App;
