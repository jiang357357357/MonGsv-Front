export interface ApiConfig {
  baseUrl: string;
  port: number;
  basePath?: string;
}

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'localhost',
  port: 40302,
  basePath: '',
};

export const getApiConfig = (): ApiConfig => {
  try {
    const saved = localStorage.getItem('apiConfig');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        baseUrl: parsed.baseUrl ?? DEFAULT_CONFIG.baseUrl,
        port: parsed.port ?? DEFAULT_CONFIG.port,
        basePath: parsed.basePath ?? DEFAULT_CONFIG.basePath,
      };
    }
  } catch (error) {
    console.error('Failed to parse API config from localStorage:', error);
  }
  return DEFAULT_CONFIG;
};

const normalizePath = (p?: string): string => {
  if (!p) return '';
  const noTrailing = String(p).replace(/\/+$/g, '');
  if (!noTrailing) return '';
  return noTrailing.startsWith('/') ? noTrailing : `/${noTrailing}`;
};

export const getApiBaseUrl = (): string => {
  const config = getApiConfig();
  const path = normalizePath(config.basePath);
  return `http://${config.baseUrl}:${config.port}${path}`;
};

export const saveApiConfig = (config: ApiConfig): void => {
  try {
    localStorage.setItem('apiConfig', JSON.stringify(config));
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

