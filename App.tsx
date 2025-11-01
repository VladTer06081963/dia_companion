
import React, { useState, useEffect, useCallback } from 'react';
import { HealthRecord, Tab } from './types';
import { loadRecords, saveRecords } from './services/storageService';
import HealthForm from './components/HealthForm';
import HistoryTable from './components/HistoryTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Diary);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  const handleAddRecord = useCallback((record: Omit<HealthRecord, 'id'>) => {
    setRecords(prevRecords => {
      const newRecord: HealthRecord = { ...record, id: Date.now().toString() };
      const updatedRecords = [newRecord, ...prevRecords].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      saveRecords(updatedRecords);
      return updatedRecords;
    });
  }, []);

  const handleDeleteRecord = useCallback((id: string) => {
    setRecords(prevRecords => {
      const updatedRecords = prevRecords.filter(record => record.id !== id);
      saveRecords(updatedRecords);
      return updatedRecords;
    });
  }, []);

  const handleImportRecords = useCallback((importedRecords: Omit<HealthRecord, 'id'>[]) => {
    setRecords(prevRecords => {
      const existingDatetimes = new Set(prevRecords.map(r => r.datetime));
      
      const newRecords = importedRecords
        .filter(ir => !existingDatetimes.has(ir.datetime))
        .map((ir, index) => ({
          ...ir,
          id: `${new Date(ir.datetime).getTime()}-${index}`
        }));

      if (newRecords.length === 0) {
          alert('Нет новых записей для импорта. Возможно, все записи в файле уже существуют в дневнике.');
          return prevRecords;
      }

      const updatedRecords = [...newRecords, ...prevRecords]
        .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      
      saveRecords(updatedRecords);
      alert(`Успешно импортировано ${newRecords.length} записей.`);
      return updatedRecords;
    });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Diary:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <HealthForm onAddRecord={handleAddRecord} />
            </div>
            <div className="lg:col-span-2">
              <HistoryTable records={records} onDeleteRecord={handleDeleteRecord} onImportRecords={handleImportRecords} />
            </div>
          </div>
        );
      case Tab.Analytics:
        return <AnalyticsDashboard records={records} />;
      case Tab.Chat:
        return <Chatbot />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tab: Tab; label: string}> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors duration-200 ${
        activeTab === tab 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
            DiaCompanion
          </h1>
          <nav className="flex space-x-2 md:space-x-4">
            <TabButton tab={Tab.Diary} label="Дневник" />
            <TabButton tab={Tab.Analytics} label="Аналитика" />
            <TabButton tab={Tab.Chat} label="Чат-ассистент" />
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
        <p>Это приложение не является медицинским устройством. Всегда консультируйтесь с врачом.</p>
      </footer>
    </div>
  );
};

export default App;
