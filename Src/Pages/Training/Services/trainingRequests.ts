export interface FullTrainingRequest {
  project_name: string;
  input_audio_dir: string;
  output_dir: string;
  language: string;
  version: string;
  world_name?: string;
  preprocessing_mode?: 'full' | 'existing';
  list_file?: string;
  train_gpt: boolean;
  train_sovits: boolean;
  gpt_batch_size: number;
  gpt_total_epoch: number;
  sovits_batch_size: number;
  sovits_total_epoch: number;
  training_order: 'sovits_first' | 'gpt_first';
  audio_files?: File[];
}

export interface StartGptTrainingRequest {
  exp_name: string;
  exp_root: string;
  batch_size: number;
  total_epoch: number;
}

export interface StartSovitsTrainingRequest {
  exp_name: string;
  exp_root: string;
  version: string;
  batch_size: number;
  total_epoch: number;
}
