
import React, { useState } from 'react';
import { LabResult } from '../types';
import { Upload } from 'lucide-react';

interface LabUploadProps {
  onAddLabResult: (result: Omit<LabResult, 'id'>) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const LabUpload: React.FC<LabUploadProps> = ({ onAddLabResult }) => {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'blood' | 'urine' | 'other'>('blood');
  const [datetime, setDatetime] = useState(new Date().toISOString().slice(0, 16));
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('Файл слишком большой. Максимальный размер: 5 МБ.');
        return;
      }
      if (!selectedFile.type.startsWith('image/')) {
        setError('Неверный тип файла. Пожалуйста, загрузите изображение.');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Пожалуйста, выберите файл для загрузки.');
      return;
    }
    try {
      const fileContent = await fileToBase64(file);
      onAddLabResult({
        datetime,
        type,
        fileName: file.name,
        fileType: file.type,
        fileContent,
      });
      // Reset form
      setFile(null);
      setFileName('');
      setError('');
      setDatetime(new Date().toISOString().slice(0, 16));
      setType('blood');
    } catch (err) {
      console.error('Error converting file to base64', err);
      setError('Не удалось обработать файл.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg mt-8">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Загрузить анализ</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="lab_datetime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Дата и время анализа</label>
            <input id="lab_datetime" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
            <label htmlFor="lab_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Тип анализа</label>
            <select id="lab_type" value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500">
                <option value="blood">Анализ крови</option>
                <option value="urine">Анализ мочи</option>
                <option value="other">Другое</option>
            </select>
        </div>
        <div>
            <label htmlFor="lab_file" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Файл (изображение до 5МБ)</label>
            <label htmlFor="lab_file" className="relative cursor-pointer flex items-center justify-center w-full px-3 py-2 border-2 border-dashed rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-500 transition-colors">
                <Upload size={20} className="mr-2 text-slate-500"/>
                <span className="text-sm text-slate-500 dark:text-slate-400">{fileName || 'Нажмите, чтобы выбрать файл'}</span>
                <input id="lab_file" type="file" accept="image/*" onChange={handleFileChange} className="sr-only"/>
            </label>
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={!file} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform duration-150 active:scale-95 shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed">
            Загрузить
        </button>
      </form>
    </div>
  );
};

export default LabUpload;
