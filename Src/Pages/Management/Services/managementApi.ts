import { getApiBaseUrl } from '../../../../System/Config';
import { createLogger } from '../../../../System/Log/logger';
import { VersionInfo, WorldInfo, RoleInfo, ModelInfo } from '../types';

const logger = createLogger('pages/management', 'api');

interface EnumVersionsResponse {
	success: boolean;
	message: string;
	versions: string[];
	current_version?: string;
	default_version?: string;
}

interface DirVersionsResponse {
	success: boolean;
	message: string;
	versions: string[];
	count: number;
}

interface WorldListResponse {
	success: boolean;
	message: string;
	version?: string | null;
	worlds: WorldInfo[];
	count: number;
}

interface CreateWorldPayload {
	name: string;
	description?: string;
}

interface CreateWorldResponse {
	success: boolean;
	message: string;
	data?: {
		id: number;
		name: string;
	};
}

interface RoleListResponse {
	success: boolean;
	message: string;
	world_id?: string | null;
	world_name?: string | null;
	roles: RoleInfo[];
	count: number;
}

interface ModelListResponse {
	success: boolean;
	message: string;
	models: ModelInfo[];
	count: number;
}

export const fetchGptModels = async (): Promise<ModelInfo[]> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/gpt/list/`;
	logger.info(`[GET] 请求 GPT 模型列表: ${apiUrl}`);
	const response = await fetch(apiUrl);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}
	const data = (await response.json()) as ModelListResponse;
	logger.info('获取 GPT 模型列表成功', { 
		url: apiUrl,
		count: data.count, 
		models: data.models 
	});
	return data.models || [];
};

export const fetchSovModels = async (): Promise<ModelInfo[]> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/sov/list/`;
	logger.info(`[GET] 请求 SOV 模型列表: ${apiUrl}`);
	const response = await fetch(apiUrl);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}
	const data = (await response.json()) as ModelListResponse;
	logger.info('获取 SOV 模型列表成功', { 
		url: apiUrl,
		count: data.count, 
		models: data.models 
	});
	return data.models || [];
};

interface CreateRolePayload {
	name: string;
	description?: string;
	world_id?: number;
	world_name?: string;
	version?: string;
	gpt_model_id?: number;
	sov_model_id?: number;
	prompt_text?: string;
	prompt_audio_path?: string;
	language?: string;
}

interface CreateRoleResponse {
	success: boolean;
	message: string;
	data?: {
		id: number;
		name: string;
	};
}

interface DeleteWorldPayload {
	id: number;
}

interface DeleteWorldResponse {
	success: boolean;
	message: string;
}

interface DeleteRolePayload {
	id: number;
}

interface DeleteRoleResponse {
	success: boolean;
	message: string;
}

export const fetchEnumVersions = async (): Promise<EnumVersionsResponse> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/models/versions/from-enum/`;
	const response = await fetch(apiUrl);
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
			// 忽略 JSON 解析错误
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as EnumVersionsResponse;
	if (!data.success) {
		throw new Error(data.message || '获取枚举版本失败');
	}
	return data;
};

export const fetchDirVersions = async (): Promise<DirVersionsResponse> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/models/versions/from-dir/`;
	const response = await fetch(apiUrl);
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as DirVersionsResponse;
	if (!data.success) {
		throw new Error(data.message || '获取目录版本失败');
	}
	return data;
};

export const loadAllVersions = async (): Promise<VersionInfo[]> => {
	const results: VersionInfo[] = [];
	try {
		const enumData = await fetchEnumVersions();
		enumData.versions.forEach((name) => {
			results.push({
				name,
				source: 'enum',
				isDefault: enumData.default_version === name,
				isCurrent: enumData.current_version === name,
			});
		});
	} catch (error) {
		logger.warn('加载枚举版本失败', { error });
	}
	try {
		const dirData = await fetchDirVersions();
		dirData.versions.forEach((name) => {
			results.push({ name, source: 'dir' });
		});
	} catch (error) {
		logger.warn('加载目录版本失败', { error });
	}
	const unique: Record<string, VersionInfo> = {};
	results.forEach((v) => {
		const existing = unique[v.name];
		if (!existing) {
			unique[v.name] = { ...v };
			return;
		}
		unique[v.name] = {
			name: v.name,
			source: existing.source,
			isDefault: existing.isDefault || v.isDefault,
			isCurrent: existing.isCurrent || v.isCurrent,
		};
	});
	return Object.values(unique).sort((a, b) => a.name.localeCompare(b.name));
};

export const fetchWorlds = async (): Promise<WorldInfo[]> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/world/list/`;
	logger.info(`[GET] 请求世界列表: ${apiUrl}`);
	const response = await fetch(apiUrl);
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as WorldListResponse;
	if (!data.success) {
		throw new Error(data.message || '获取世界列表失败');
	}
	logger.info('获取世界列表成功', { 
		url: apiUrl,
		count: data.count, 
		worlds: data.worlds 
	});
	return data.worlds || [];
};

export const fetchRolesByVersion = async (version: string): Promise<RoleInfo[]> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/role/list/?version=${encodeURIComponent(version)}`;
	logger.info(`[GET] 按版本请求角色列表: ${apiUrl}`);
	const response = await fetch(apiUrl);
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as RoleListResponse;
	if (!data.success) {
		throw new Error(data.message || '获取角色列表失败');
	}
	logger.info('根据版本获取角色列表成功', { 
		url: apiUrl,
		version,
		count: data.count, 
		roles: data.roles 
	});
	return data.roles || [];
};

export const createWorld = async (payload: CreateWorldPayload): Promise<CreateWorldResponse> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/world/create/`;
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as CreateWorldResponse;
	if (!data.success) {
		throw new Error(data.message || '创建世界失败');
	}
	return data;
};

export const fetchRolesByWorld = async (worldId?: number, worldName?: string): Promise<RoleInfo[]> => {
	const baseUrl = getApiBaseUrl();
	const params: string[] = [];
	if (worldId !== undefined) {
		params.push(`world_id=${encodeURIComponent(String(worldId))}`);
	}
	if (worldName) {
		params.push(`world_name=${encodeURIComponent(worldName)}`);
	}
	const isAll = params.length === 0;
	const apiUrl = `${baseUrl}/api/role/list/${params.length > 0 ? '?' + params.join('&') : ''}`;
	
	logger.info(`[GET] ${isAll ? '请求全部角色列表' : '按世界请求角色列表'}: ${apiUrl}`);
	
	const response = await fetch(apiUrl);
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as RoleListResponse;
	if (!data.success) {
		throw new Error(data.message || '获取角色列表失败');
	}
	logger.info(isAll ? '获取全部角色列表成功' : '根据世界获取角色列表成功', { 
		url: apiUrl,
		world_id: worldId, 
		world_name: worldName, 
		count: data.count, 
		roles: data.roles 
	});
	return data.roles || [];
};

export const createRole = async (payload: CreateRolePayload): Promise<CreateRoleResponse> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/role/create/`;
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as CreateRoleResponse;
	if (!data.success) {
		throw new Error(data.message || '创建角色失败');
	}
	return data;
};

export const importRole = async (formData: FormData): Promise<CreateRoleResponse> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/role/import/`;
	logger.info(`[POST] 请求导入角色: ${apiUrl}`);
	const response = await fetch(apiUrl, {
		method: 'POST',
		body: formData,
	});
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as CreateRoleResponse;
	if (!data.success) {
		throw new Error(data.message || '导入角色失败');
	}
	return data;
};

interface UpdateRolePayload extends CreateRolePayload {
	id: number;
}

export const updateRole = async (payload: UpdateRolePayload): Promise<CreateRoleResponse> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/role/update/`;
	logger.info(`[POST] 请求更新角色: ${apiUrl}`, { payload });
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as CreateRoleResponse;
	if (!data.success) {
		throw new Error(data.message || '更新角色失败');
	}
	return data;
};

export const deleteWorld = async (payload: DeleteWorldPayload): Promise<DeleteWorldResponse> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/world/delete/`;
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ id: payload.id }),
	});
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as DeleteWorldResponse;
	if (!data.success) {
		throw new Error(data.message || '删除世界失败');
	}
	return data;
};

export const deleteRole = async (payload: DeleteRolePayload): Promise<DeleteRoleResponse> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/role/delete/`;
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ id: payload.id }),
	});
	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.message) {
				errorMessage = errorData.message;
			}
		} catch (e) {
		}
		throw new Error(errorMessage);
	}
	const data = (await response.json()) as DeleteRoleResponse;
	if (!data.success) {
		throw new Error(data.message || '删除角色失败');
	}
	return data;
};
