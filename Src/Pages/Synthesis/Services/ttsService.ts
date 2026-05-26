import {
  buildRoleEmotionSynthesisUrl,
  buildSynthesizeUrl,
  buildTTSCleanupModelsUrl,
  buildTTSLoadModelsUrl,
  buildTTSStateUrl,
  buildTTSUnloadModelsUrl,
} from './synthesisRoutes';
import {
  TTSCleanupModelsResponse,
  TTSLoadModelsResponse,
  RoleEmotionSynthesisParams,
  TTSRequestParams,
  TTSError,
  TTSStateResponse,
  TTSUnloadModelsResponse,
} from './synthesisTypes';

const LANGUAGE_CODE_MAP: Record<string, string> = {
  '中文': 'zh',
  'English': 'en',
  '日本語': 'ja',
  'Mix': 'auto',
  zh: 'zh',
  en: 'en',
  ja: 'ja',
  auto: 'auto',
  auto_yue: 'auto_yue',
  yue: 'yue',
  ko: 'ko',
  all_zh: 'all_zh',
  all_ja: 'all_ja',
  all_yue: 'all_yue',
  all_ko: 'all_ko',
};

export const mapLanguageToCode = (lang: string): string => {
  return LANGUAGE_CODE_MAP[lang] || lang;
};

const decodeAudioBuffer = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  try {
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioContext.close();
  }
};

const decodeBase64Audio = (value: string): ArrayBuffer => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const extractError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const errorData = (await response.json()) as TTSError;
    return errorData.detail || errorData.message || errorData.Exception || fallback;
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
};

export const synthesizeSpeech = async (params: TTSRequestParams): Promise<AudioBuffer> => {
  const apiUrl = buildSynthesizeUrl();
  const formData = new FormData();

  formData.append('text', params.text);
  formData.append('text_language', mapLanguageToCode(params.text_language));
  formData.append('ref_audio_path', params.ref_audio_path);
  formData.append('prompt_language', mapLanguageToCode(params.prompt_language));
  formData.append('return_base64', 'true');

  if (params.prompt_text) formData.append('prompt_text', params.prompt_text);
  if (params.top_k !== undefined) formData.append('top_k', params.top_k.toString());
  if (params.top_p !== undefined) formData.append('top_p', params.top_p.toString());
  if (params.temperature !== undefined) formData.append('temperature', params.temperature.toString());
  if (params.speed !== undefined) formData.append('speed', params.speed.toString());
  if (params.sample_steps !== undefined) formData.append('sample_steps', params.sample_steps.toString());
  if (params.if_sr !== undefined) formData.append('if_sr', String(params.if_sr));
  if (params.how_to_cut !== undefined) formData.append('how_to_cut', params.how_to_cut);
  if (params.ref_free !== undefined) formData.append('ref_free', String(params.ref_free));
  if (params.if_freeze !== undefined) formData.append('if_freeze', String(params.if_freeze));
  if (params.pause_second !== undefined) formData.append('pause_second', params.pause_second.toString());

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractError(response, 'TTS合成失败'));
  }

  const payload = await response.json();
  if (!payload?.success) {
    throw new Error(payload?.message || 'TTS合成失败');
  }
  if (!payload.audio_data) {
    throw new Error('后端未返回音频数据');
  }

  return await decodeAudioBuffer(decodeBase64Audio(payload.audio_data));
};

export const synthesizeByRoleEmotion = async (params: RoleEmotionSynthesisParams): Promise<AudioBuffer> => {
  const apiUrl = buildRoleEmotionSynthesisUrl();
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...params,
      text_language: mapLanguageToCode(params.text_language),
      return_base64: true,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractError(response, '按角色情感合成失败'));
  }

  const payload = await response.json();
  if (!payload?.success) {
    throw new Error(payload?.message || '按角色情感合成失败');
  }
  if (!payload.audio_data) {
    throw new Error('后端未返回音频数据');
  }

  return await decodeAudioBuffer(decodeBase64Audio(payload.audio_data));
};

export const loadTTSModels = async (gptPath: string, sovitsPath: string): Promise<TTSLoadModelsResponse> => {
  const apiUrl = buildTTSLoadModelsUrl();
  const formData = new FormData();
  formData.append('gpt_path', gptPath);
  formData.append('sovits_path', sovitsPath);

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractError(response, '模型加载失败'));
  }

  return (await response.json()) as TTSLoadModelsResponse;
};

export const getTTSState = async (): Promise<TTSStateResponse> => {
  const apiUrl = buildTTSStateUrl();
  const response = await fetch(apiUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(await extractError(response, '获取模型状态失败'));
  }

  return (await response.json()) as TTSStateResponse;
};

export const unloadTTSModels = async (): Promise<TTSUnloadModelsResponse> => {
  const apiUrl = buildTTSUnloadModelsUrl();
  const response = await fetch(apiUrl, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await extractError(response, '模型卸载失败'));
  }

  return (await response.json()) as TTSUnloadModelsResponse;
};

export const cleanupTTSModels = async (force = false): Promise<TTSCleanupModelsResponse> => {
  const apiUrl = buildTTSCleanupModelsUrl();
  const formData = new FormData();
  formData.append('force', String(force));

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractError(response, '模型驻留清理失败'));
  }

  return (await response.json()) as TTSCleanupModelsResponse;
};
