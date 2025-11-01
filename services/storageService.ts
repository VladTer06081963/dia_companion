
import { HealthRecord } from '../types';

const getStorageKey = (userEmail: string) => `diaCompanionRecords_${userEmail}`;

export const saveRecords = (records: HealthRecord[], userEmail: string): void => {
  if (!userEmail) return;
  try {
    const serializedState = JSON.stringify(records);
    localStorage.setItem(getStorageKey(userEmail), serializedState);
  } catch (error) {
    console.error("Could not save records to local storage", error);
  }
};

export const loadRecords = (userEmail: string): HealthRecord[] => {
  if (!userEmail) return [];
  try {
    const serializedState = localStorage.getItem(getStorageKey(userEmail));
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

export const deleteRecords = (userEmail: string): void => {
    if (!userEmail) return;
    try {
        localStorage.removeItem(getStorageKey(userEmail));
    } catch (error) {
        console.error("Could not delete records from local storage", error);
    }
}