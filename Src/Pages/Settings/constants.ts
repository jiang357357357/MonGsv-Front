import { Model, Audio } from './types';

export const MOCK_MODELS: Model[] = [
  { id: 'v1', name: 'Kore_v1.0', size: '120MB', date: '2023-10-01' },
  { id: 'v2', name: 'Kore_v2.0 (Active)', size: '145MB', date: '2023-11-15' },
  { id: 'v3', name: 'Puck_Beta', size: '130MB', date: '2023-11-20' },
];

export const MOCK_AUDIOS: Audio[] = [
  { id: 'a1', name: 'sample_001.wav', duration: '5s', emotion: 'Happy' },
  { id: 'a2', name: 'sample_002.wav', duration: '3s', emotion: 'Neutral' },
  { id: 'a3', name: 'sample_003.wav', duration: '8s', emotion: 'Sad' },
  { id: 'a4', name: 'noise_floor.wav', duration: '10s', emotion: 'None' },
];






