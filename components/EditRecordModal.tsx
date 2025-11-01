import React, { useState, useEffect } from 'react';
import { HealthRecord } from '../types';

interface EditRecordModalProps {
  record: HealthRecord;
  onClose: () => void;
  onSave: (record: HealthRecord) => void;
}

const InputField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  isTextarea?: boolean;
  step?: string;
}> = ({ id, label, error, isTextarea, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    {isTextarea ? (
      <textarea id={id} rows={3} {...props} className={`w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200 bg-slate-50 dark:bg-slate-700 ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'}`} />
    ) : (
      <input id={id} {...props} className={`w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200 bg-slate-50 dark:bg-slate-700 ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'}`} />
    )}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);


const EditRecordModal: React.FC<EditRecordModalProps> = ({ record, onClose, onSave }) => {
  const [glucose, setGlucose] = useState(record.glucose?.toString() ?? '');
  const [systolic, setSystolic] = useState(record.systolic?.toString() ?? '');
  const [diastolic, setDiastolic] = useState(record.diastolic?.toString() ?? '');
  const [comment, setComment] = useState(record.comment ?? '');
  const [datetime, setDatetime] = useState(record.datetime);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Handle Escape key to close modal
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const glucoseEntered = glucose.trim() !== '';
    const systolicEntered = systolic.trim() !== '';
    const diastolicEntered = diastolic.trim() !== '';

    if (glucoseEntered) {
      const glucoseNum = parseFloat(glucose);
      if (isNaN(glucoseNum) || glucoseNum < 2.0 || glucoseNum > 30.0) {
        newErrors.glucose = 'Глюкоза: 2.0 - 30.0 ммоль/л';
      }
    }

    if (systolicEntered || diastolicEntered) {
        if (!systolicEntered) {
            newErrors.systolic = 'Введите систолическое';
        } else {
            const systolicNum = parseInt(systolic, 10);
            if (isNaN(systolicNum) || systolicNum < 70 || systolicNum > 200) {
              newErrors.systolic = 'Систолическое: 70 - 200 мм рт.ст.';
            }
        }
        if (!diastolicEntered) {
            newErrors.diastolic = 'Введите диастолическое';
        } else {
            const diastolicNum = parseInt(diastolic, 10);
            if (isNaN(diastolicNum) || diastolicNum < 40 || diastolicNum > 130) {
              newErrors.diastolic = 'Диастолическое: 40 - 130 мм рт.ст.';
            }
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (glucose.trim() === '' && systolic.trim() === '' && diastolic.trim() === '') {
        alert('Введите хотя бы один показатель: глюкозу или давление.');
        return;
    }

    if (validate()) {
      const updatedRecord: HealthRecord = {
        ...record,
        datetime,
        comment,
        glucose: glucose.trim() !== '' ? parseFloat(glucose) : undefined,
        systolic: systolic.trim() !== '' ? parseInt(systolic, 10) : undefined,
        diastolic: diastolic.trim() !== '' ? parseInt(diastolic, 10) : undefined,
      };

      if (updatedRecord.systolic === undefined || updatedRecord.diastolic === undefined) {
          updatedRecord.systolic = undefined;
          updatedRecord.diastolic = undefined;
      }
      
      onSave(updatedRecord);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md m-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Редактировать запись</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField id="edit_datetime" label="Дата и время" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
          <InputField id="edit_glucose" label="Глюкоза (ммоль/л)" type="number" step="0.1" placeholder="5.5" value={glucose} onChange={(e) => setGlucose(e.target.value)} error={errors.glucose} />
          <div className="grid grid-cols-2 gap-4">
            <InputField id="edit_systolic" label="Систолическое" type="number" placeholder="120" value={systolic} onChange={(e) => setSystolic(e.target.value)} error={errors.systolic} />
            <InputField id="edit_diastolic" label="Диастолическое" type="number" placeholder="80" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} error={errors.diastolic} />
          </div>
          <InputField id="edit_comment" label="Комментарий (необязательно)" isTextarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Самочувствие, прием пищи и т.д." />
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500">
              Отмена
            </button>
            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-150 active:scale-95 shadow-md">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecordModal;
