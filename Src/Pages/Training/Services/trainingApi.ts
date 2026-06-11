import { getApiBaseUrl } from '../../../../System/Config';
import { createLogger } from '../../../../System/Log/logger';
import { FullTrainingRequest, StartGptTrainingRequest, StartSovitsTrainingRequest } from './trainingRequests';
import { FullTrainingWorkflowResponse, TrainingLaunchResponse, TrainingStatusResponse } from './trainingResponses';

const logger = createLogger('pages/training', 'trainingService');

export interface WorldInfo {
  id: number;
  name: string;
  description?: string;
  version?: string | null;
}

export interface RoleInfo {
  id: number;
  name: string;
  world_id?: number | null;
  world_name?: string | null;
}

export interface RoleWorkspaceInfo {
  role_name: string;
  world_name?: string | null;
  base_version?: string | null;
  role_root: string;
  model_sliced_dir: string;
  raw_dir: string;
  sliced_dir: string;
  raw_files: string[];
  model_sliced_files?: string[];
}

export interface LocalDialogResponse {
  success: boolean;
  path: string;
  cancelled: boolean;
}

const parseError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data = await response.json();
    return data.detail || data.message || fallback;
  } catch {
    return `HTTP ${response.status}: ${response.statusText || fallback}`;
  }
};

export const selectLocalDirectory = async (
  title: string,
  initialDir = '',
): Promise<string> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/system/dialog/select-directory`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, initial_dir: initialDir }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, '打开文件夹选择器失败'));
  }

  const data = await response.json() as LocalDialogResponse;
  if (!data.success) {
    throw new Error('打开文件夹选择器失败');
  }
  return data.path || '';
};

export const selectLocalFile = async (
  title: string,
  initialDir = '',
  filetypes: Array<[string, string]> = [['All files', '*.*']],
): Promise<string> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/system/dialog/select-file`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, initial_dir: initialDir, filetypes }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, '打开文件选择器失败'));
  }

  const data = await response.json() as LocalDialogResponse;
  if (!data.success) {
    throw new Error('打开文件选择器失败');
  }
  return data.path || '';
};

export const getTrainingVersions = async (): Promise<string[]> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/models/versions/from-enum/`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || '获取版本列表失败');
  }

  return (data.versions || []) as string[];
};

export const startFullTraining = async (
  params: FullTrainingRequest,
): Promise<FullTrainingWorkflowResponse> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/workflow/training/full`;
  const formData = new FormData();

  formData.append('project_name', params.project_name);
  formData.append('input_audio_dir', params.input_audio_dir);
  formData.append('output_dir', params.output_dir);
  formData.append('language', params.language);
  formData.append('version', params.version);
  formData.append('preprocessing_mode', params.preprocessing_mode || 'full');
  if (params.list_file) {
    formData.append('list_file', params.list_file);
  }
  if (params.world_name) {
    formData.append('world_name', params.world_name);
  }
  formData.append('train_gpt', String(params.train_gpt));
  formData.append('train_sovits', String(params.train_sovits));
  formData.append('gpt_batch_size', String(params.gpt_batch_size));
  formData.append('gpt_total_epoch', String(params.gpt_total_epoch));
  formData.append('sovits_batch_size', String(params.sovits_batch_size));
  formData.append('sovits_total_epoch', String(params.sovits_total_epoch));
  formData.append('training_order', params.training_order);
  for (const file of params.audio_files || []) {
    formData.append('audio_files', file);
  }

  logger.info('启动统一训练引导', params);

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, '训练引导启动失败'));
  }

  const data: FullTrainingWorkflowResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || '训练引导启动失败');
  }

  return data;
};

export const getTrainingStatus = async (jobId: string): Promise<TrainingStatusResponse> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/training/status/${encodeURIComponent(jobId)}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(await parseError(response, `获取训练状态失败: ${jobId}`));
  }

  return await response.json() as TrainingStatusResponse;
};

export const startGptTraining = async (params: StartGptTrainingRequest): Promise<TrainingLaunchResponse> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/training/gpt/start`;
  const formData = new FormData();

  formData.append('exp_name', params.exp_name);
  formData.append('exp_root', params.exp_root);
  formData.append('batch_size', String(params.batch_size));
  formData.append('total_epoch', String(params.total_epoch));

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'GPT训练启动失败'));
  }

  const data: TrainingLaunchResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'GPT训练启动失败');
  }
  return data;
};

export const startSovitsTraining = async (params: StartSovitsTrainingRequest): Promise<TrainingLaunchResponse> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/training/sovits/start`;
  const formData = new FormData();

  formData.append('exp_name', params.exp_name);
  formData.append('exp_root', params.exp_root);
  formData.append('version', params.version);
  formData.append('batch_size', String(params.batch_size));
  formData.append('total_epoch', String(params.total_epoch));

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'SoVITS训练启动失败'));
  }

  const data: TrainingLaunchResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'SoVITS训练启动失败');
  }
  return data;
};

export const stopTrainingJob = async (jobId: string): Promise<void> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/training/stop/${encodeURIComponent(jobId)}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await parseError(response, `停止训练失败: ${jobId}`));
  }
};

export const getWorlds = async (): Promise<WorldInfo[]> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/world/list/`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || '获取世界列表失败');
  }

  return (data.worlds || []) as WorldInfo[];
};

export const getRolesByWorld = async (worldId: number): Promise<RoleInfo[]> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/role/list/?world_id=${encodeURIComponent(String(worldId))}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || '获取角色列表失败');
  }

  return (data.roles || []) as RoleInfo[];
};

export const getRoleWorkspaces = async (): Promise<RoleWorkspaceInfo[]> => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/role/workspace/list/`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || '获取角色工作区列表失败');
  }

  return (data.workspaces || []) as RoleWorkspaceInfo[];
};
