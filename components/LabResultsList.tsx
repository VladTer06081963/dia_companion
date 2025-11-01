
import React from 'react';
import { LabResult } from '../types';
import { Paperclip, Trash2 } from 'lucide-react';

interface LabResultsListProps {
  labResults: LabResult[];
  onDeleteLabResult: (id: string) => void;
}

const LabResultsList: React.FC<LabResultsListProps> = ({ labResults, onDeleteLabResult }) => {
    
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleView = (result: LabResult) => {
        const dataUrl = `data:${result.fileType};base64,${result.fileContent}`;
        window.open(dataUrl, '_blank');
    };

    const getTypeName = (type: LabResult['type']) => {
        switch (type) {
            case 'blood': return 'Анализ крови';
            case 'urine': return 'Анализ мочи';
            default: return 'Другое';
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg mt-8">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Загруженные анализы</h2>
            {labResults.length > 0 ? (
                <ul className="space-y-3">
                    {labResults.map(result => (
                        <li key={result.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <Paperclip className="text-slate-500 flex-shrink-0" size={20} />
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{result.fileName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{getTypeName(result.type)} - {formatDateTime(result.datetime)}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                                <button onClick={() => handleView(result)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                                    Просмотр
                                </button>
                                <button onClick={() => onDeleteLabResult(result.id)} className="text-red-500 hover:text-red-700 transition-colors" aria-label={`Удалить анализ ${result.fileName}`}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">Нет загруженных анализов.</p>
            )}
        </div>
    );
};

export default LabResultsList;
