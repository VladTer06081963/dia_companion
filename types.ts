
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
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}