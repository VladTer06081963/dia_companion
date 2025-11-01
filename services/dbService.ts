import { LabResult, ArchivedAnalysis, ArchivedChat, ArchivedRecordEdit, HealthRecord } from '../types';

const DB_NAME = 'DiaCompanionDB';
const DB_VERSION = 3; // Incremented version for schema change
const LAB_STORE_NAME = 'labResults';
const ANALYSIS_STORE_NAME = 'archivedAnalyses';
const CHAT_STORE_NAME = 'archivedChats';
const EDIT_HISTORY_STORE_NAME = 'recordEdits';


let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(true);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject(false);
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(LAB_STORE_NAME)) {
        db.createObjectStore(LAB_STORE_NAME, { keyPath: 'id' });
      }
       if (!db.objectStoreNames.contains(ANALYSIS_STORE_NAME)) {
        db.createObjectStore(ANALYSIS_STORE_NAME, { keyPath: 'id' });
      }
       if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
        db.createObjectStore(CHAT_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(EDIT_HISTORY_STORE_NAME)) {
        db.createObjectStore(EDIT_HISTORY_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// --- Lab Results ---

export const addLabResult = (result: LabResult): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LAB_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(LAB_STORE_NAME);
    const request = store.add(result);
    
    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Error adding lab result:', request.error);
        reject(request.error);
    };
  });
};

export const getLabResults = (): Promise<LabResult[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
        console.error("DB not initialized");
        return resolve([]);
    }
    const transaction = db.transaction([LAB_STORE_NAME], 'readonly');
    const store = transaction.objectStore(LAB_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        const results = request.result.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
        resolve(results);
    };
    request.onerror = () => {
        console.error('Error getting lab results:', request.error);
        reject(request.error);
    };
  });
};

export const deleteLabResult = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LAB_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(LAB_STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => {
          console.error('Error deleting lab result:', request.error);
          reject(request.error);
      };
    });
};

// --- Archived Analyses ---

export const addArchivedAnalysis = (analysis: ArchivedAnalysis): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ANALYSIS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(ANALYSIS_STORE_NAME);
    const request = store.add(analysis);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getArchivedAnalyses = (): Promise<ArchivedAnalysis[]> => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve([]);
    const transaction = db.transaction([ANALYSIS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(ANALYSIS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
        const results = request.result.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
        resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteArchivedAnalysis = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ANALYSIS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(ANALYSIS_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Archived Chats ---

export const addArchivedChat = (chat: ArchivedChat): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHAT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CHAT_STORE_NAME);
    const request = store.add(chat);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getArchivedChats = (): Promise<ArchivedChat[]> => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve([]);
    const transaction = db.transaction([CHAT_STORE_NAME], 'readonly');
    const store = transaction.objectStore(CHAT_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
        const results = request.result.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
        resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteArchivedChat = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHAT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CHAT_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Record Edit History ---

export const addArchivedRecordEdit = (edit: ArchivedRecordEdit): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EDIT_HISTORY_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(EDIT_HISTORY_STORE_NAME);
    const request = store.add(edit);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getArchivedRecordEdits = (): Promise<ArchivedRecordEdit[]> => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve([]);
    const transaction = db.transaction([EDIT_HISTORY_STORE_NAME], 'readonly');
    const store = transaction.objectStore(EDIT_HISTORY_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteArchivedRecordEdit = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EDIT_HISTORY_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(EDIT_HISTORY_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
