export interface TrainingStreamData {
  stage:
    | 'audio_slice'
    | 'asr_recognition'
    | 'text_processing'
    | 'audio_features'
    | 'semantic_encoding'
    | 'sovits_training'
    | 'gpt_training'
    | 'finished'
    | 'failed';
  status: 'started' | 'running' | 'completed' | 'skipped' | 'error';
  message: string;
  step?: string;
  progress?: number;
  epoch?: number;
  total_epoch?: number;
  loss?: number;
  error?: string;
  exp_name?: string;
  version?: string;
  character?: string;
  output_dir?: string;
  output_file?: string;
  data?: unknown;
}

export type TrainingProgressCallback = (data: TrainingStreamData) => void;

export interface GatewayStepResult {
  success?: boolean;
  message?: string;
  job_id?: string;
  output_file?: string;
  output_files?: Record<string, string>;
  [key: string]: unknown;
}

export interface GatewayWorkflowStep {
  step: string;
  result: GatewayStepResult;
}

export interface FullTrainingWorkflowResponse {
  success: boolean;
  message: string;
  workflow_type?: string;
  project_name: string;
  project_root: string;
  preprocess_steps: GatewayWorkflowStep[];
  training_workflow: TrainingWorkflowStatus;
  steps: GatewayWorkflowStep[];
  next_action?: string;
}

export type TrainingTargetName = 'gpt' | 'sovits';
export type TrainingTargetStatus = 'pending' | 'starting' | 'running' | 'completed' | 'failed' | 'stopped';
export type TrainingWorkflowState = 'queued' | 'running' | 'completed' | 'failed' | 'stopped';

export interface TrainingWorkflowTarget {
  target: TrainingTargetName;
  status: TrainingTargetStatus;
  job_id: string | null;
  launch: Record<string, unknown> | null;
  details: TrainingStatusPayload | null;
  error: string | null;
}

export interface TrainingWorkflowStatus {
  workflow_id: string;
  project_name: string;
  project_root: string;
  version: string;
  order: TrainingTargetName[];
  status: TrainingWorkflowState;
  current_target: TrainingTargetName | null;
  targets: TrainingWorkflowTarget[];
  dataset: Record<string, unknown>;
  error: string | null;
}

export interface TrainingStatusPayload {
  job_id: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  current_epoch?: number;
  total_epochs?: number;
  current_loss?: number;
  error_message?: string | null;
  log_file?: string | null;
}

export interface TrainingStatusResponse {
  type: 'gpt' | 'sovits';
  status: TrainingStatusPayload;
}

export interface TrainingLaunchResponse {
  success: boolean;
  message: string;
  job_id?: string;
  config_file?: string | null;
  log_dir?: string | null;
  model_dir?: string | null;
}
