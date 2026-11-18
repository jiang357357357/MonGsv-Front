export interface ApiConfig {
  baseUrl: string;
  port: number;
  basePath?: string;
}

const DEFAULT_PORT = Number((import.meta as any).env?.VITE_MON_GSV_PORT || 40302);

// Portable distributions inject their local service address before the app loads.
declare global {
  interface Window {
    __MON_GSV_RUNTIME__?: { backendHost: string; backendPort: number };
  }
}

const runtimeConfig = () => typeof window === 'undefined' ? undefined : window.__MON_GSV_RUNTIME__;
const configStorageKey = () => {
  const runtime = runtimeConfig();
  return runtime ? `apiConfig:local:${runtime.backendHost}:${runtime.backendPort}` : 'apiConfig';
};

export const getDefaultApiConfig = (): ApiConfig => ({
  baseUrl: runtimeConfig()?.backendHost || (typeof window === 'undefined' ? 'localhost' : window.location.hostname || 'localhost'),
  port: runtimeConfig()?.backendPort || DEFAULT_PORT,
  basePath: '',
});

export const normalizeApiConfig = (config: ApiConfig): ApiConfig => {
  const baseUrl = config.baseUrl.trim();
  if (!baseUrl || /[\s/?#@]/.test(baseUrl)) {
    throw new Error('请填写域名或 IP 地址，不要包含 http://、端口或路径');
  }
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('端口号必须是 1–65535 之间的整数');
  }
  const basePath = (config.basePath || '').trim().replace(/\/+$/g, '');
  return { baseUrl, port: config.port, basePath: basePath && !basePath.startsWith('/') ? `/${basePath}` : basePath };
};

export const buildApiBaseUrl = (config: ApiConfig): string => {
  const normalized = normalizeApiConfig(config);
  const host = normalized.baseUrl.includes(':') && !normalized.baseUrl.startsWith('[')
    ? `[${normalized.baseUrl}]`
    : normalized.baseUrl;
  return `http://${host}:${normalized.port}${normalized.basePath}`;
};

export const getApiConfig = (): ApiConfig => {
  const defaults = getDefaultApiConfig();
  try {
    const saved = localStorage.getItem(configStorageKey());
    if (saved) {
      const parsed = JSON.parse(saved);
      return normalizeApiConfig({
        baseUrl: parsed.baseUrl ?? defaults.baseUrl,
        port: parsed.port ?? defaults.port,
        basePath: parsed.basePath ?? defaults.basePath,
      });
    }
  } catch (error) {
    console.error('Failed to parse API config from localStorage:', error);
  }
  return defaults;
};

export const getApiBaseUrl = (): string => {
  return buildApiBaseUrl(getApiConfig());
};

export const saveApiConfig = (config: ApiConfig): void => {
  try {
    localStorage.setItem(configStorageKey(), JSON.stringify(normalizeApiConfig(config)));
  } catch (error) {
    console.error('Failed to save API config to localStorage:', error);
    throw error;
  }
};

export type AppEnv = 'development' | 'production' | 'test';

const resolveEnv = (): AppEnv => {
  const mode =
    (import.meta as any).env?.MODE ||
    (process as any).env?.NODE_ENV ||
    'development';

  if (mode === 'production') return 'production';
  if (mode === 'test') return 'test';
  return 'development';
};

export interface FrontendConfig {
  env: AppEnv;
  api: ApiConfig;
}

export const getFrontendConfig = (): FrontendConfig => {
  return {
    env: resolveEnv(),
    api: getApiConfig(),
  };
};

