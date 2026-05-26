import { getApiBaseUrl } from '../../../../System/Config';

export const buildVersionsUrl = (modelsRoot?: string): string => {
  const baseUrl = getApiBaseUrl();
	let url = `${baseUrl}/api/models/versions/from-enum/`;
  if (modelsRoot) {
    url += `?models_root=${encodeURIComponent(modelsRoot)}`;
  }
  return url;
};

export const buildCharactersUrl = (version: string, modelsRoot?: string): string => {
  const baseUrl = getApiBaseUrl();
  let url = `${baseUrl}/api/models/info/characters/?version=${encodeURIComponent(version)}`;
  if (modelsRoot) {
    url += `&models_root=${encodeURIComponent(modelsRoot)}`;
  }
  return url;
};

export const buildSynthesizeUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/inference/tts`;
};

export const buildRoleEmotionSynthesisUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/synthesis/role-emotion`;
};

export const buildTTSStateUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/inference/models/info`;
};

export const buildTTSLoadModelsUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/inference/models/load`;
};

export const buildTTSUnloadModelsUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/inference/models/unload`;
};

export const buildTTSCleanupModelsUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/inference/models/cleanup`;
};

export const buildReferenceAudioUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl().replace(/\/+$/g, '');
  return `${baseUrl}/inference/ref-audio?path=${encodeURIComponent(path)}`;
};
