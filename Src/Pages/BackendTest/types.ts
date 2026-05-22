export type HttpMethod = 'GET' | 'POST';
export type RequestContentType = 'json' | 'form' | 'multipart';

export interface RoutePreset {
  id: string;
  title: string;
  method: HttpMethod;
  path: string;
  description: string;
  contentType?: RequestContentType;
  body?: string;
}

export interface RouteTestRequest {
  contentType?: RequestContentType;
  bodyText?: string;
  files?: File[];
  filesByField?: Record<string, File[]>;
}

export interface RouteTestResult {
  ok: boolean;
  status: number;
  url: string;
  method: HttpMethod;
  contentType: RequestContentType;
  durationMs: number;
  data: unknown;
}

export interface RoleWorkspaceOption {
  role_name: string;
  role_root: string;
  raw_dir: string;
  sliced_dir: string;
  raw_files: string[];
  prompt_dir?: string;
  prompt_files?: string[];
  gpt_models?: string[];
  sovits_models?: string[];
}
