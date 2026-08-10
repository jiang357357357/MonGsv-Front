export enum AppView {
  SYNTHESIS = 'SYNTHESIS',
  TRAINING = 'TRAINING',
  EMOTION = 'EMOTION',
  BACKEND_TEST = 'BACKEND_TEST',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  MANAGEMENT = 'MANAGEMENT'
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  style: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  module: string;
}

export interface FlowNode {
  id: string;
  label: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  icon?: any;
}

export interface TrainingMetric {
  step: number;
  loss: number;
  lr: number;
}
