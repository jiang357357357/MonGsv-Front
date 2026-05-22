import { buildVersionsUrl } from './synthesisRoutes';
import { VersionsResponse, EmotionInfo } from './synthesisTypes';
import { getApiBaseUrl } from '../../../../System/Config';
import { RoleInfo } from '../../Management/types';

interface RoleListResponse {
	success: boolean;
	message: string;
	roles: RoleInfo[];
	count: number;
}

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

/**
 * 获取所有版本列表
 * @param modelsRoot 模型根目录路径（可选，默认: "models"）
 */
export const getVersions = async (modelsRoot?: string): Promise<string[]> => {
  const apiUrl = buildVersionsUrl(modelsRoot);

  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: VersionsResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '获取版本列表失败');
    }

    // 返回 versions 字段中的版本列表
    return data.versions || [];
  } catch (error) {
    console.error('获取版本列表失败:', error);
    throw error instanceof Error ? error : new Error('获取版本列表失败');
  }
};

/**
 * 获取指定版本和世界（可选）的角色列表
 * @param version 版本名称（必需）
 * @param worldId 世界 ID（可选）
 * @param worldName 世界名称（可选）
 */
export const getCharacters = async (version?: string, worldId?: number, worldName?: string): Promise<RoleInfo[]> => {
	const baseUrl = getApiBaseUrl();
	const params: string[] = [];
	if (version) params.push(`version=${encodeURIComponent(version)}`);
	if (worldId !== undefined) params.push(`world_id=${encodeURIComponent(String(worldId))}`);
	if (worldName) params.push(`world_name=${encodeURIComponent(worldName)}`);

	const apiUrl = `${baseUrl}/api/role/list/${params.length > 0 ? '?' + params.join('&') : ''}`;

	try {
		const response = await fetch(apiUrl);
		
		if (!response.ok) {
			if (response.status === 404) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.detail || '版本或角色不存在');
			}
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = (await response.json()) as RoleListResponse;
		
		if (!data.success) {
			throw new Error(data.message || '获取角色列表失败');
		}

		return data.roles || [];
	} catch (error) {
		console.error('获取角色列表失败:', error);
		throw error instanceof Error ? error : new Error('获取角色列表失败');
	}
};

/**
 * 获取角色的参考配置
 * @param version 版本名称（必需）
 * @param character 角色名称（必需）
 * @param worldId 世界 ID（可选）
 * @param worldName 世界名称（可选）
 */
export const getEmotions = async (roleId: number): Promise<EmotionInfo[]> => {
	const baseUrl = getApiBaseUrl();
	const apiUrl = `${baseUrl}/api/role/emotions/?role_id=${encodeURIComponent(String(roleId))}`;

	try {
		const response = await fetch(apiUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = (await response.json()) as RoleEmotionListResponse;
		if (!data.success) {
			throw new Error(data.message || '获取情感列表失败');
		}

		return (data.emotions || []).map((emotion) => ({
			name: emotion.name,
			text: emotion.text,
			music_url: emotion.music_url,
			text_emotion: emotion.name,
			text_language: emotion.text_language,
		}));
	} catch (error) {
		console.error('获取情感列表失败:', error);
		throw error instanceof Error ? error : new Error('获取情感列表失败');
	}
};
