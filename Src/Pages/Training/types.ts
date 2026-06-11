export interface SubStep {
  id: string;
  label: string;
}

export interface TrainingPhase {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  subSteps: SubStep[];
}

export interface TrainingParams {
  preprocessingMode: 'full' | 'existing';
  version: string;
  language: string;
  worldId?: number | null;
  worldName?: string;
  roleId?: number | null;
  characterName: string;
  inputAudioDir: string;
  listFile: string;
  outputDir: string;
  trainSovits: boolean;
  trainGpt: boolean;
  trainingOrder: 'sovits_first' | 'gpt_first';
  sovitsBatchSize: number;
  sovitsEpoch: number;
  gptBatchSize: number;
  gptEpoch: number;
  gpuNumbers?: string;
}

export type TrainingStepStatus = 'pending' | 'starting' | 'processing' | 'completed' | 'error';

export type BackendTrainingStep = 'dataset_prepare' | 'sovits_train' | 'gpt_train';
