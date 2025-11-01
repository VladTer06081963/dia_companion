import React, { useState, useEffect, useCallback } from 'react';
import { HealthRecord, LabResult, Tab, User } from './types';
import { loadRecords, saveRecords } from './services/storageService';
import { initDB, getLabResults, addLabResult, deleteLabResult, addArchivedRecordEdit } from './services/dbService';
import HealthForm from './components/HealthForm';
import HistoryTable from './components/HistoryTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Chatbot from './components/Chatbot';
import LabUpload from './components/LabUpload';
import LabResultsList from './components/LabResultsList';
import Archive from './components/Archive';
import EditRecordModal from './components/EditRecordModal';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import { LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Diary);
  const [dbReady, setDbReady] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const isDbReady = await initDB();
      setDbReady(isDbReady);
      const loggedInUser = sessionStorage.getItem('diaCompanionUser');
      if (loggedInUser) {
          setCurrentUser(JSON.parse(loggedInUser));
      }
    };
    initialize();
  }, []);

  const loadUserData = useCallback(async (email: string) => {
    setRecords(loadRecords(email));
    if (dbReady) {
      const results = await getLabResults(email);
      setLabResults(results);
    }
  }, [dbReady]);

  useEffect(() => {
    if (currentUser && dbReady) {
      loadUserData(currentUser.email);
    } else {
      setRecords([]);
      setLabResults([]);
    }
  }, [currentUser, dbReady, loadUserData]);

  const handleAuthSuccess = (user: User) => {
    sessionStorage.setItem('diaCompanionUser', JSON.stringify(user));
    setCurrentUser(user);
    setActiveTab(Tab.Diary);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('diaCompanionUser');
    setCurrentUser(null);
  };

  const handleAddRecord = useCallback((record: Omit<HealthRecord, 'id'>) => {
    if (!currentUser) return;
    setRecords(prevRecords => {
      const newRecord: HealthRecord = { ...record, id: Date.now().toString() };
      const updatedRecords = [newRecord, ...prevRecords].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      saveRecords(updatedRecords, currentUser.email);
      return updatedRecords;
    });
  }, [currentUser]);
  
  const handleEditRecord = useCallback((id: string) => {
    const recordToEdit = records.find(r => r.id === id);
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
    }
  }, [records]);

  const handleUpdateRecord = useCallback(async (updatedRecord: HealthRecord) => {
    if (!currentUser) return;
    const originalRecord = records.find(r => r.id === updatedRecord.id);
    if (!originalRecord) return;

    await addArchivedRecordEdit({
      datetime: new Date().toISOString(),
      recordId: originalRecord.id,
      originalRecord,
      updatedRecord,
    }, currentUser.email);

    setRecords(prevRecords => {
      const updatedRecords = prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r)
        .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      saveRecords(updatedRecords, currentUser.email);
      return updatedRecords;
    });
    setEditingRecord(null);
  }, [records, currentUser]);


  const handleDeleteRecord = useCallback((id: string) => {
    if (!currentUser) return;
    setRecords(prevRecords => {
      const updatedRecords = prevRecords.filter(record => record.id !== id);
      saveRecords(updatedRecords, currentUser.email);
      return updatedRecords;
    });
  }, [currentUser]);

  const handleImportRecords = useCallback((importedRecords: Omit<HealthRecord, 'id'>[]) => {
    if (!currentUser) return;
    setRecords(prevRecords => {
      const existingDatetimes = new Set(prevRecords.map(r => r.datetime));
      const newRecords = importedRecords
        .filter(ir => !existingDatetimes.has(ir.datetime))
        .map((ir, index) => ({ ...ir, id: `${new Date(ir.datetime).getTime()}-${index}`}));

      if (newRecords.length === 0) {
          alert('Нет новых записей для импорта. Возможно, все записи в файле уже существуют в дневнике.');
          return prevRecords;
      }

      const updatedRecords = [...newRecords, ...prevRecords]
        .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      
      saveRecords(updatedRecords, currentUser.email);
      alert(`Успешно импортировано ${newRecords.length} записей.`);
      return updatedRecords;
    });
  }, [currentUser]);

  const handleAddLabResult = useCallback(async (result: Omit<LabResult, 'id' | 'userEmail'>) => {
    if (!dbReady || !currentUser) return;
    await addLabResult(result, currentUser.email);
    const updatedResults = await getLabResults(currentUser.email);
    setLabResults(updatedResults);
    alert('Анализ успешно загружен.');
  }, [dbReady, currentUser]);

  const handleDeleteLabResult = useCallback(async (id: string) => {
    if (!dbReady || !currentUser) return;
    await deleteLabResult(id);
    const updatedResults = await getLabResults(currentUser.email);
    setLabResults(updatedResults);
  }, [dbReady, currentUser]);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Diary:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <HealthForm onAddRecord={handleAddRecord} />
              <LabUpload onAddLabResult={handleAddLabResult} />
            </div>
            <div className="lg:col-span-2">
              <HistoryTable records={records} onDeleteRecord={handleDeleteRecord} onImportRecords={handleImportRecords} onEditRecord={handleEditRecord} />
              <LabResultsList labResults={labResults} onDeleteLabResult={handleDeleteLabResult} />
            </div>
          </div>
        );
      case Tab.Analytics:
        return <AnalyticsDashboard records={records} labResults={labResults} user={currentUser!} />;
      case Tab.Chat:
        return <Chatbot user={currentUser!} />;
      case Tab.Archive:
        return <Archive user={currentUser!} />;
      case Tab.Admin:
        return currentUser?.role === 'admin' ? <AdminPanel currentUser={currentUser} /> : null;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tab: Tab; label: string}> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors duration-200 text-center ${
        activeTab === tab 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  );

  if (!dbReady) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка базы данных...</div>;
  }
  
  if (!currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <h1 className="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
            DiaCompanion
          </h1>
          <nav className="grid grid-cols-2 md:grid-cols-3 lg:flex gap-2 w-full max-w-lg md:w-auto md:flex md:space-x-4">
            <TabButton tab={Tab.Diary} label="Дневник" />
            <TabButton tab={Tab.Analytics} label="Аналитика" />
            <TabButton tab={Tab.Chat} label="Чат-ассистент" />
            <TabButton tab={Tab.Archive} label="Архив" />
            {currentUser.role === 'admin' && <TabButton tab={Tab.Admin} label="Админ-панель" />}
          </nav>
           <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden lg:block">{currentUser.email}</span>
            <button onClick={handleLogout} className="p-2 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-colors" aria-label="Выйти">
                <LogOut size={18} />
            </button>
           </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
        <p>Это приложение не является медицинским устройством. Всегда консультируйтесь с врачом.</p>
      </footer>
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleUpdateRecord}
        />
      )}
    </div>
  );
};

export default App;