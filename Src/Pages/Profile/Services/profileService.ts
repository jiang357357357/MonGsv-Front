import { getApiBaseUrl } from '../../../../System/Config';
import {
  RegisteredSpeaker,
  SpeakerListResponse,
  SpeakerMutationResponse,
} from '../types';

const buildUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl().replace(/\/+$/g, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

const readError = async (response: Response, fallback: string): Promise<string> => {
  const raw = await response.text();
  if (!raw) return fallback;

  try {
    const data = JSON.parse(raw) as { detail?: string; message?: string };
    return data.detail || data.message || fallback;
  } catch {
    return raw;
  }
};

export const fetchRegisteredSpeakers = async (): Promise<RegisteredSpeaker[]> => {
  const response = await fetch(buildUrl('/asr/speaker/list/'));
  if (!response.ok) {
    throw new Error(await readError(response, `获取声纹状态失败（HTTP ${response.status}）`));
  }

  const data = (await response.json()) as SpeakerListResponse;
  return data.speakers || [];
};

export const registerVoiceprint = async (
  audioFile: File,
  displayName: string,
): Promise<SpeakerMutationResponse> => {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('name', displayName);

  const response = await fetch(buildUrl('/asr/speaker/register/'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await readError(response, `注册声纹失败（HTTP ${response.status}）`));
  }

  return (await response.json()) as SpeakerMutationResponse;
};

export const unregisterVoiceprint = async (): Promise<SpeakerMutationResponse> => {
  const formData = new FormData();

  const response = await fetch(buildUrl('/asr/speaker/unregister/'), {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await readError(response, `注销声纹失败（HTTP ${response.status}）`));
  }

  return (await response.json()) as SpeakerMutationResponse;
};
