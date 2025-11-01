
import { HealthRecord } from '../types';

const STORAGE_KEY = 'diaCompanionRecords';

export const saveRecords = (records: HealthRecord[]): void => {
  try {
    const serializedState = JSON.stringify(records);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Could not save records to local storage", error);
  }
};

export const loadRecords = (): HealthRecord[] => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return [];
    }
    const records: HealthRecord[] = JSON.parse(serializedState);
    // Sort by date descending to ensure order is always correct on load
    return records.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  } catch (error) {
    console.error("Could not load records from local storage", error);
    return [];
  }
};
