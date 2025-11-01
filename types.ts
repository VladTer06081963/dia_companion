export interface HealthRecord {
  id: string;
  datetime: string;
  glucose?: number;
  systolic?: number;
  diastolic?: number;
  comment?: string;
}

export enum Tab {
  Diary = 'diary',
  Analytics = 'analytics',
  Chat = 'chat',
  Archive = 'archive',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface LabResult {
  id: string;
  datetime: string;
  type: 'blood' | 'urine' | 'other';
  fileName: string;
  fileType: string;
  fileContent: string; // base64 encoded
}

export interface ArchivedAnalysis {
    id: string;
    datetime: string;
    analysis: {
        text: string;
        sources: any[];
    };
}

export interface ArchivedChat {
    id: string;
    datetime: string;
    messages: ChatMessage[];
}

export interface ArchivedRecordEdit {
  id: string; // Unique ID for the edit itself
  datetime: string; // When the edit was made
  recordId: string; // ID of the original record
  originalRecord: HealthRecord;
  updatedRecord: HealthRecord;
}
