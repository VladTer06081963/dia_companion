import { LabResult, ArchivedAnalysis, ArchivedChat, ArchivedRecordEdit, User } from '../types';

const DB_NAME = 'DiaCompanionDB';
const DB_VERSION = 4; // Incremented version for schema change
const USERS_STORE_NAME = 'users';
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
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      if (event.oldVersion < 4) {
        if (!db.objectStoreNames.contains(USERS_STORE_NAME)) {
            db.createObjectStore(USERS_STORE_NAME, { keyPath: 'email' });
        }
        const storesToUpdate = [LAB_STORE_NAME, ANALYSIS_STORE_NAME, CHAT_STORE_NAME, EDIT_HISTORY_STORE_NAME];
        storesToUpdate.forEach(storeName => {
            if (db.objectStoreNames.contains(storeName)) {
                const store = transaction!.objectStore(storeName);
                if (!store.indexNames.contains('byUserEmail')) {
                    store.createIndex('byUserEmail', 'userEmail', { unique: false });
                }
            }
        });
      }

      // Initial stores creation for a fresh DB
      if (!db.objectStoreNames.contains(LAB_STORE_NAME)) {
        const store = db.createObjectStore(LAB_STORE_NAME, { keyPath: 'id' });
        store.createIndex('byUserEmail', 'userEmail', { unique: false });
      }
       if (!db.objectStoreNames.contains(ANALYSIS_STORE_NAME)) {
        const store = db.createObjectStore(ANALYSIS_STORE_NAME, { keyPath: 'id' });
        store.createIndex('byUserEmail', 'userEmail', { unique: false });
      }
       if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
        const store = db.createObjectStore(CHAT_STORE_NAME, { keyPath: 'id' });
        store.createIndex('byUserEmail', 'userEmail', { unique: false });
      }
      if (!db.objectStoreNames.contains(EDIT_HISTORY_STORE_NAME)) {
        const store = db.createObjectStore(EDIT_HISTORY_STORE_NAME, { keyPath: 'id' });
        store.createIndex('byUserEmail', 'userEmail', { unique: false });
      }
    };
  });
};

// --- User Management ---
export const addUser = (user: User): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([USERS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(USERS_STORE_NAME);
    const getRequest = store.get(user.email);
    getRequest.onsuccess = () => {
        if(getRequest.result) {
            reject(new Error('Пользователь с таким email уже существует.'));
        } else {
            const addRequest = store.add(user);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getUser = (email: string, password: string):Promise<User | null> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([USERS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(USERS_STORE_NAME);
        const request = store.get(email);
        request.onsuccess = () => {
            const user = request.result;
            if (user && user.password === password) {
                resolve(user);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// --- Data functions updated for multi-user ---

const executeRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const executeGetAll = <T>(storeName: string, userEmail: string): Promise<T[]> => {
  if (!db) return Promise.resolve([]);
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  const index = store.index('byUserEmail');
  const request = index.getAll(userEmail);
  return executeRequest(request).then(results => results.sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()));
};

// --- Lab Results ---
export const addLabResult = (result: Omit<LabResult, 'id' | 'userEmail'>, userEmail: string): Promise<void> => {
  const transaction = db.transaction([LAB_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(LAB_STORE_NAME);
  const newResult: LabResult = { ...result, id: Date.now().toString(), userEmail };
  return executeRequest(store.add(newResult)).then(() => {});
};
export const getLabResults = (userEmail: string): Promise<LabResult[]> => executeGetAll(LAB_STORE_NAME, userEmail);
export const deleteLabResult = (id: string): Promise<void> => executeRequest(db.transaction([LAB_STORE_NAME], 'readwrite').objectStore(LAB_STORE_NAME).delete(id)).then(() => {});


// --- Archived Analyses ---
export const addArchivedAnalysis = (analysis: Omit<ArchivedAnalysis, 'id' | 'userEmail'>, userEmail: string): Promise<void> => {
  const transaction = db.transaction([ANALYSIS_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(ANALYSIS_STORE_NAME);
  const newAnalysis: ArchivedAnalysis = { ...analysis, id: Date.now().toString(), userEmail };
  return executeRequest(store.add(newAnalysis)).then(() => {});
};
export const getArchivedAnalyses = (userEmail: string): Promise<ArchivedAnalysis[]> => executeGetAll(ANALYSIS_STORE_NAME, userEmail);
export const deleteArchivedAnalysis = (id: string): Promise<void> => executeRequest(db.transaction([ANALYSIS_STORE_NAME], 'readwrite').objectStore(ANALYSIS_STORE_NAME).delete(id)).then(() => {});


// --- Archived Chats ---
export const addArchivedChat = (chat: Omit<ArchivedChat, 'id' | 'userEmail'>, userEmail: string): Promise<void> => {
  const transaction = db.transaction([CHAT_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(CHAT_STORE_NAME);
  const newChat: ArchivedChat = { ...chat, id: Date.now().toString(), userEmail };
  return executeRequest(store.add(newChat)).then(() => {});
};
export const getArchivedChats = (userEmail: string): Promise<ArchivedChat[]> => executeGetAll(CHAT_STORE_NAME, userEmail);
export const deleteArchivedChat = (id: string): Promise<void> => executeRequest(db.transaction([CHAT_STORE_NAME], 'readwrite').objectStore(CHAT_STORE_NAME).delete(id)).then(() => {});


// --- Record Edit History ---
export const addArchivedRecordEdit = (edit: Omit<ArchivedRecordEdit, 'id' | 'userEmail'>, userEmail: string): Promise<void> => {
  const transaction = db.transaction([EDIT_HISTORY_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(EDIT_HISTORY_STORE_NAME);
  const newEdit: ArchivedRecordEdit = { ...edit, id: Date.now().toString(), userEmail };
  return executeRequest(store.add(newEdit)).then(() => {});
};
export const getArchivedRecordEdits = (userEmail: string): Promise<ArchivedRecordEdit[]> => executeGetAll(EDIT_HISTORY_STORE_NAME, userEmail);
export const deleteArchivedRecordEdit = (id: string): Promise<void> => executeRequest(db.transaction([EDIT_HISTORY_STORE_NAME], 'readwrite').objectStore(EDIT_HISTORY_STORE_NAME).delete(id)).then(() => {});
