import { getApiBaseUrl } from '../../../../System/Config';
import { createLogger } from '../../../../System/Log/logger';
import { EmotionInfo } from '../types';

const logger = createLogger('pages/emotion', 'emotionService');

interface RoleEmotionApiItem {
  name: string;
  text: string;
  music_url: string;
  text_language?: string;
  file_name: string;
}

interface RoleEmotionListResponse {
  success: boolean;
  message: string;
  role_id: number;
  emotions: RoleEmotionApiItem[];
  count: number;
}

interface RoleMutationResponse {
  success: boolean;
  message: string;
  data?: {
    emotion?: string;
    text?: string;
    audio_file?: string;
    file_name?: string;
    deleted_emotion?: string;
    emotions?: RoleEmotionApiItem[];
  };
}

interface RoleWorkspaceListResponse {
  success: boolean;
  message: string;
  workspaces: RoleWorkspaceInfo[];
  count: number;
}

export interface RoleWorkspaceInfo {
  role_name: string;
  world_name?: string | null;
  base_version?: string | null;
  model_sliced_dir: string;
  model_sliced_files?: string[];
}

export interface SaveRoleEmotionParams {
  roleId: number;
  emotionName: string;
  emotionText: string;
  audioFile?: File | null;
  audioSourcePath?: string | null;
  textLanguage?: string;
}

export interface TranscribeRequestParams {
  audio_file?: File;
  audio_path?: string;
  asr_lang?: string;
  asr_model?: string;
  pure_text?: boolean;
}

export interface TranscribeResponse {
  text: string;
  language: string;
}

interface TranscribeApiPayload {
  success?: boolean;
  message?: string;
  text?: string;
  language?: string;
  segments?: Array<{ text?: string; language?: string }>;
}

const readError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data = await response.json();
    return data?.detail || data?.message || fallback;
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
};

const convertRoleEmotion = (emotion: RoleEmotionApiItem): EmotionInfo => ({
  emotion: emotion.name,
  text: emotion.text,
  audio_files: emotion.music_url ? [emotion.music_url] : [],
  text_language: emotion.text_language,
});

export const getRoleEmotions = async (roleId: number): Promise<EmotionInfo[]> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/role/emotions/?role_id=${encodeURIComponent(String(roleId))}`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(await readError(response, '获取情感列表失败'));
  }

  const data = (await response.json()) as RoleEmotionListResponse;
  if (!data.success) {
    throw new Error(data.message || '获取情感列表失败');
  }

  return (data.emotions || []).map(convertRoleEmotion);
};

export const saveRoleEmotion = async (params: SaveRoleEmotionParams): Promise<EmotionInfo[]> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/role/emotions/upsert/`;
  const formData = new FormData();
  formData.append('role_id', String(params.roleId));
  formData.append('emotion_name', params.emotionName);
  formData.append('emotion_text', params.emotionText);
  if (params.textLanguage) {
    formData.append('text_language', params.textLanguage);
  }
  if (params.audioFile) {
    formData.append('audio_file', params.audioFile, params.audioFile.name);
  }
  if (params.audioSourcePath) {
    formData.append('audio_source_path', params.audioSourcePath);
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readError(response, '保存情感配置失败'));
  }

  const data = (await response.json()) as RoleMutationResponse;
  if (!data.success) {
    throw new Error(data.message || '保存情感配置失败');
  }

  return (data.data?.emotions || []).map(convertRoleEmotion);
};

export const deleteRoleEmotion = async (roleId: number, emotionName: string): Promise<EmotionInfo[]> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/role/emotions/delete/`;
  const formData = new FormData();
  formData.append('role_id', String(roleId));
  formData.append('emotion_name', emotionName);

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readError(response, '删除情感配置失败'));
  }

  const data = (await response.json()) as RoleMutationResponse;
  if (!data.success) {
    throw new Error(data.message || '删除情感配置失败');
  }

  return (data.data?.emotions || []).map(convertRoleEmotion);
};

export const getReferenceTextLanguages = async (): Promise<string[]> => {
  return ['zh', 'en', 'ja', 'mix'];
};

export const getRoleWorkspaces = async (): Promise<RoleWorkspaceInfo[]> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/role/workspace/list/`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(await readError(response, '获取角色工作区列表失败'));
  }

  const data = (await response.json()) as RoleWorkspaceListResponse;
  if (!data.success) {
    throw new Error(data.message || '获取角色工作区列表失败');
  }

  return data.workspaces || [];
};

export const getAudioFileUrl = (audioFile: string): string => {
  const baseUrl = getApiBaseUrl().replace(/\/+$/g, '');
  if (audioFile.startsWith('/inference/') || audioFile.startsWith('/api/')) {
    const cleanPath = audioFile.startsWith('/') ? audioFile : `/${audioFile}`;
    return `${baseUrl}${cleanPath}`;
  }
  return `${baseUrl}/inference/ref-audio?path=${encodeURIComponent(audioFile)}`;
};

const parseTranscribePayload = (
  data: TranscribeApiPayload,
  fallbackLanguage: string,
): TranscribeResponse => {
  const segments = Array.isArray(data.segments) ? data.segments : [];

  const text = typeof data.text === 'string' && data.text.trim()
    ? data.text.trim()
    : segments
        .map((item) => (typeof item?.text === 'string' ? item.text.trim() : ''))
        .filter(Boolean)
        .join(' ')
        .trim();

  const language = typeof data.language === 'string' && data.language.trim()
    ? data.language
    : segments.find((item) => typeof item?.language === 'string' && item.language.trim())?.language || fallbackLanguage;

  return { text, language };
};

export const transcribeAudio = async (params: TranscribeRequestParams): Promise<TranscribeResponse> => {
  if (!params.audio_file && !params.audio_path) {
    throw new Error('请先选择音频文件');
  }

  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/inference/transcribe`;

  const formData = new FormData();
  formData.append('language', params.asr_lang || 'zh');
  formData.append('model_type', params.asr_model === 'faster_whisper' ? 'faster_whisper' : 'funasr');
  if (params.audio_file) {
    formData.append('audio_file', params.audio_file, params.audio_file.name);
  }
  if (params.audio_path) {
    formData.append('audio_path', params.audio_path);
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await readError(response, '语音转录失败'));
    }

    const data = await response.json();
    if (data.success === false) {
      throw new Error(data.message || '语音转录失败');
    }

    return parseTranscribePayload(data as TranscribeApiPayload, params.asr_lang || 'zh');
  } catch (error) {
    logger.error('语音转录失败', { error: error instanceof Error ? error.message : error });
    throw error instanceof Error ? error : new Error('语音转录失败');
  }
};
