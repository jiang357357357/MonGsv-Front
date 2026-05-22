import { getApiBaseUrl } from '../../../../System/Config';
import {
  HttpMethod,
  RequestContentType,
  RoleWorkspaceOption,
  RouteTestRequest,
  RouteTestResult,
} from '../types';

const buildUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl().replace(/\/+$/g, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export const runRouteTest = async (
  method: HttpMethod,
  path: string,
  request?: RouteTestRequest
): Promise<RouteTestResult> => {
  const url = buildUrl(path);
  const started = performance.now();
  const contentType: RequestContentType = request?.contentType || 'json';

  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (method === 'POST') {
    if (contentType === 'form' || contentType === 'multipart') {
      const formData = new FormData();
      const rawText = request?.bodyText?.trim() || '{}';
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      Object.entries(parsed).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        formData.append(key, String(value));
      });
      if (contentType === 'multipart' && request?.files?.length) {
        request.files.forEach((file) => {
          formData.append('files', file);
        });
      }
      if (contentType === 'multipart' && request?.filesByField) {
        Object.entries(request.filesByField).forEach(([fieldName, files]) => {
          files.forEach((file) => {
            formData.append(fieldName, file);
          });
        });
      }
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = request?.bodyText && request.bodyText.trim() ? request.bodyText : '{}';
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  const durationMs = Math.round(performance.now() - started);
  const rawText = await response.text();

  let data: unknown = rawText;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    url,
    method,
    contentType,
    durationMs,
    data,
  };
};

interface RoleWorkspaceListResponse {
  success: boolean;
  message: string;
  workspaces: RoleWorkspaceOption[];
  count: number;
}

export const fetchRoleWorkspaces = async (): Promise<RoleWorkspaceOption[]> => {
  const response = await fetch(buildUrl('/api/role/workspace/list/'));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = (await response.json()) as RoleWorkspaceListResponse;
  return data.workspaces || [];
};
