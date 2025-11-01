
import React, { useState, useRef, useEffect } from 'react';
import { HealthRecord } from '../types';
import { Trash2, ChevronLeft, ChevronRight, Download, Upload, Pencil } from 'lucide-react';

interface HistoryTableProps {
  records: HealthRecord[];
  onDeleteRecord: (id: string) => void;
  onImportRecords: (records: Omit<HealthRecord, 'id'>[]) => void;
  onEditRecord: (id: string) => void;
}

const RECORDS_PER_PAGE = 10;

const HistoryTable: React.FC<HistoryTableProps> = ({ records, onDeleteRecord, onImportRecords, onEditRecord }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(records.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const currentRecords = records.slice(startIndex, endIndex);

  useEffect(() => {
    const newTotalPages = Math.ceil(records.length / RECORDS_PER_PAGE);
    if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1);
    }
  }, [records.length, currentPage]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleExport = () => {
    if (records.length === 0) {
      alert("Нет данных для экспорта.");
      return;
    }

    const headers = ['datetime', 'glucose', 'systolic', 'diastolic', 'comment'];
    const csvRows = [headers.join(',')];

    for (const record of [...records].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())) {
      const values = [
        record.datetime,
        record.glucose ?? '',
        record.systolic ?? '',
        record.diastolic ?? '',
        `"${record.comment?.replace(/"/g, '""') ?? ''}"`
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `diacompanion_export_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const importedRecords = parseCSV(text);
        onImportRecords(importedRecords);
      } catch (error) {
        alert(`Ошибка при импорте файла: ${(error as Error).message}`);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
        alert('Не удалось прочитать файл.');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string): Omit<HealthRecord, 'id'>[] => {
    const lines = text.trim().split('\n');
    const headerLine = lines.shift()?.trim();
    if (!headerLine) throw new Error('Файл пустой или неверного формата.');
    
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    const colMap: { [key: string]: number } = {};
    headers.forEach((h, i) => colMap[h] = i);

    if (!headers.includes('datetime')) {
        throw new Error('Неверный формат CSV. Отсутствует обязательный заголовок: datetime');
    }
    
    const parsedRecords: Omit<HealthRecord, 'id'>[] = [];
    lines.forEach((line, index) => {
        if (!line.trim()) return;
        
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        if (!values) {
            console.warn(`Skipping row ${index + 2}: invalid structure.`);
            return;
        }

        const getVal = (colName: string) => {
            const idx = colMap[colName];
            if (idx === undefined) return undefined;
            let val = values[idx]?.trim();
            if (val?.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1).replace(/""/g, '"');
            }
            return val;
        };

        const datetime = getVal('datetime');
        if (!datetime || isNaN(new Date(datetime).getTime())) {
            console.warn(`Skipping row ${index + 2}: invalid or missing datetime.`);
            return;
        }

        const newRecord: Omit<HealthRecord, 'id'> = {
            datetime,
            comment: getVal('comment') || '',
        };

        const glucoseVal = getVal('glucose');
        if (glucoseVal && glucoseVal.trim() !== '') {
            const glucose = parseFloat(glucoseVal);
            if (!isNaN(glucose)) {
                newRecord.glucose = glucose;
            }
        }

        const systolicVal = getVal('systolic');
        const diastolicVal = getVal('diastolic');
        if (systolicVal && systolicVal.trim() !== '' && diastolicVal && diastolicVal.trim() !== '') {
            const systolic = parseInt(systolicVal, 10);
            const diastolic = parseInt(diastolicVal, 10);
            if (!isNaN(systolic) && !isNaN(diastolic)) {
                newRecord.systolic = systolic;
                newRecord.diastolic = diastolic;
            }
        }

        if (newRecord.glucose !== undefined || newRecord.systolic !== undefined) {
            parsedRecords.push(newRecord);
        } else {
            console.warn(`Skipping row ${index + 2}: no valid measurement data found.`);
        }
    });

    if (parsedRecords.length === 0 && lines.length > 0) {
        throw new Error('В файле не найдено корректных записей для импорта.');
    }
    return parsedRecords;
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const getGlucoseClass = (glucose?: number) => {
    if (glucose === undefined) return '';
    if (glucose > 10.0 || glucose < 4.0) {
      return 'text-red-500 font-bold';
    }
    return '';
  };
  
  const getPressureClass = (systolic?: number, diastolic?: number) => {
    if (systolic === undefined || diastolic === undefined) return '';
    if (systolic > 140 || diastolic > 90) {
      return 'text-red-500 font-bold';
    }
    return '';
  };

  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Показано {records.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, records.length)} из {records.length}
      </span>
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium">
          Стр. {currentPage} / {totalPages > 0 ? totalPages : 1}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">История измерений</h2>
        <div className="flex space-x-2">
           <input
             type="file"
             ref={fileInputRef}
             onChange={handleFileChange}
             accept=".csv"
             className="hidden"
           />
           <button 
             onClick={handleImportClick}
             className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
             aria-label="Импорт из CSV"
           >
             <Upload size={16} />
             <span>Импорт</span>
           </button>
           <button 
             onClick={handleExport}
             className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
             aria-label="Экспорт в CSV"
           >
             <Download size={16} />
             <span>Экспорт</span>
           </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {records.length > 0 ? (
          <>
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3">Дата и время</th>
                  <th scope="col" className="px-4 py-3">Глюкоза (ммоль/л)</th>
                  <th scope="col" className="px-4 py-3">Давление</th>
                  <th scope="col" className="px-4 py-3">Комментарий</th>
                  <th scope="col" className="px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map(record => (
                  <tr key={record.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{formatDateTime(record.datetime)}</td>
                    <td className={`px-4 py-3 ${getGlucoseClass(record.glucose)}`}>{record.glucose !== undefined ? record.glucose.toFixed(1) : '—'}</td>
                    <td className={`px-4 py-3 ${getPressureClass(record.systolic, record.diastolic)}`}>{record.systolic !== undefined && record.diastolic !== undefined ? `${record.systolic}/${record.diastolic}` : '—'}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{record.comment}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => onEditRecord(record.id)} className="text-blue-500 hover:text-blue-700 transition-colors" aria-label={`Редактировать запись от ${formatDateTime(record.datetime)}`}>
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => onDeleteRecord(record.id)} className="text-red-500 hover:text-red-700 transition-colors" aria-label={`Удалить запись от ${formatDateTime(record.datetime)}`}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && <PaginationControls />}
          </>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">Записей пока нет. Добавьте первое измерение или импортируйте данные.</p>
        )}
      </div>
    </div>
  );
};

export default HistoryTable;