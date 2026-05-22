export interface Model {
  id: string;
  name: string;
  size: string;
  date: string;
}

export interface Audio {
  id: string;
  name: string;
  duration: string;
  emotion: string;
}

export type SettingsCategory = 'models' | 'dataset' | 'audio' | 'terminal' | 'api';

