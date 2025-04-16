export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string;
  ai_insights?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  body: string;
  time: string;
  status: 'pending' | 'completed' | 'missed';
  notification_id?: string;
  created_at: string;
}

export interface NotificationData {
  reminderId: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  JournalEntry: { entryId?: string };
  History: undefined;
  Settings: undefined;
  Reminder: { reminderId?: string };
}; 