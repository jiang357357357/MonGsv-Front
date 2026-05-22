export interface VersionInfo {
  id: string;
  name: string;
}

export interface VersionsResponse {
  success: boolean;
  message: string;
  versions: string[];
  count: number;
}

export interface CharactersResponse {
  success: boolean;
  message: string;
  version: string;
  characters: string[];
  count: number;
}

export interface EmotionInfo {
  name: string;
  text: string;
  music_url: string;
  text_emotion?: string;
  text_language?: string;
}

export interface EmotionsResponse {
  success: boolean;
  message: string;
  version: string;
  character: string;
  emotions: EmotionInfo[];
  count: number;
}

export interface TTSRequestParams {
  text: string;
  text_language: string;
  ref_audio_path: string;
  prompt_text?: string;
  prompt_language: string;
  top_k?: number;
  top_p?: number;
  temperature?: number;
  speed?: number;
  sample_steps?: number;
  if_sr?: boolean;
  how_to_cut?: string;
  ref_free?: boolean;
  if_freeze?: boolean;
  pause_second?: number;
  inp_refs?: string[];
}

export interface TTSError {
  detail?: string;
  message?: string;
  Exception?: string;
}

export interface TTSResidencyConfig {
  idle_ttl_seconds: number;
  max_loaded_models: number;
  cleanup_interval_seconds: number;
}

export interface TTSResidencyRecord {
  model_key: string;
  gpt_path: string;
  sovits_path: string;
  loaded_at: string;
  last_used_at: string;
  active_requests: number;
  status: 'loaded' | 'unloaded' | string;
  unload_reason?: string | null;
}

export interface TTSResidencyStatus {
  current_model_key?: string | null;
  config: TTSResidencyConfig;
  records: TTSResidencyRecord[];
}

export interface TTSStateResponse {
  gpt_path?: string | null;
  sovits_path?: string | null;
  model_version?: string | null;
  device?: string | null;
  is_half?: boolean;
  models_loaded?: boolean;
  supported_languages?: string[];
  residency?: TTSResidencyStatus;
}

export interface TTSLoadModelsResponse {
  success: boolean;
  message: string;
  gpt_path?: string;
  sovits_path?: string;
}

export interface TTSUnloadModelsResponse {
  success: boolean;
  message: string;
  unloaded: boolean;
}

export interface TTSCleanupModelsResponse {
  success: boolean;
  message: string;
  unloaded: Array<{
    model_key: string;
    reason: string;
  }>;
}
