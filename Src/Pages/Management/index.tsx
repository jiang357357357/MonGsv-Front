import React, { useEffect, useState } from 'react';
import { createLogger } from '../../../System/Log/logger';
import { VersionInfo, WorldInfo, RoleInfo, ModelInfo } from './types';
import VersionsPage from './Pages/Versions';
import WorldsPage from './Pages/Worlds';
import RolesPage from './Pages/Roles';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import { AppView } from '../../types';
import {
	loadAllVersions,
	fetchWorlds,
	fetchRolesByVersion,
	createWorld,
	fetchRolesByWorld,
	updateRole,
	importRole,
	deleteWorld,
	deleteRole,
	fetchGptModels,
	fetchSovModels,
} from './Services/managementApi';

const logger = createLogger('pages/management', 'index');

type OverviewTab = 'versions' | 'worlds' | 'roles';

const ManagementDashboard: React.FC = () => {
	const [versions, setVersions] = useState<VersionInfo[]>([]);
	const [worlds, setWorlds] = useState<WorldInfo[]>([]);
	const [roles, setRoles] = useState<RoleInfo[]>([]);
	const [gptModels, setGptModels] = useState<ModelInfo[]>([]);
	const [sovModels, setSovModels] = useState<ModelInfo[]>([]);
	const [currentVersion, setCurrentVersion] = useState('');
	const [currentWorldName, setCurrentWorldName] = useState('');
	const [currentRoleName, setCurrentRoleName] = useState('');
	const [currentGptId, setCurrentGptId] = useState<number | undefined>(undefined);
	const [currentSovId, setCurrentSovId] = useState<number | undefined>(undefined);
	const [isLoadingVersions, setIsLoadingVersions] = useState(true);
	const [isLoadingWorlds, setIsLoadingWorlds] = useState(false);
	const [isLoadingRoles, setIsLoadingRoles] = useState(false);
	const [activeTab, setActiveTab] = useState<OverviewTab>('worlds');
	const [versionError, setVersionError] = useState<string | null>(null);
	const [worldError, setWorldError] = useState<string | null>(null);
	const [roleError, setRoleError] = useState<string | null>(null);
	
	const [editingRole, setEditingRole] = useState<RoleInfo | null>(null);
	const [gptFile, setGptFile] = useState<File | null>(null);
	const [sovFile, setSovFile] = useState<File | null>(null);
	const [selectedRoleVersion, setSelectedRoleVersion] = useState('');

	useEffect(() => {
		const load = async () => {
			setIsLoadingVersions(true);
			setIsLoadingWorlds(true);
			setVersionError(null);
			setWorldError(null);
			try {
				// 并行加载版本、世界和模型
				const [vData, wData, gData, sData] = await Promise.all([
					loadAllVersions(),
					fetchWorlds(),
					fetchGptModels(),
					fetchSovModels()
				]);
				
				setVersions(vData);
				setWorlds(wData);
				setGptModels(gData);
				setSovModels(sData);

				logger.info('初始数据加载完成', { 
					versionsCount: vData.length, 
					worldsCount: wData.length, 
					gptModelsCount: gData.length, 
					sovModelsCount: sData.length,
					data: { versions: vData, worlds: wData, gptModels: gData, sovModels: sData }
				});

				if (vData.length > 0) {
					const current = vData.find((v) => v.isCurrent) || vData.find((v) => v.isDefault) || vData[0];
					if (current) {
						setCurrentVersion(current.name);
					}
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : '加载初始数据失败';
				setVersionError(message);
				logger.error('加载初始数据失败', { error });
			} finally {
				setIsLoadingVersions(false);
				setIsLoadingWorlds(false);
			}
		};
		load();
	}, []);

	const applyVersion = async (value: string) => {
		setCurrentVersion(value);
		setRoles([]);
		setRoleError(null);
		
		if (!value) {
			return;
		}

		setIsLoadingRoles(true);
		try {
			// 加载该版本下的所有角色
			const rs = await fetchRolesByVersion(value);
			setRoles(rs);
			logger.info(`版本 [${value}] 角色加载成功`, { count: rs.length, roles: rs });
		} catch (error) {
			const message = error instanceof Error ? error.message : '加载角色列表失败';
			setRoleError(message);
			logger.error('加载角色列表失败', { error });
		} finally {
			setIsLoadingRoles(false);
		}
	};

	const applyWorld = async (value: string, options?: { preserveRoleDraft?: boolean }) => {
		const worldName = value.trim();
		const preserveRoleDraft = options?.preserveRoleDraft ?? false;
		setCurrentWorldName(worldName);
		setRoles([]);
		if (!preserveRoleDraft) {
			setCurrentRoleName('');
		}
		setRoleError(null);
		
		setIsLoadingRoles(true);
		try {
			const world = worlds.find((w) => w.name === worldName) || null;
			const rs = await fetchRolesByWorld(world ? world.id : undefined, worldName || undefined);
			setRoles(rs);
			logger.info(worldName ? `世界 [${worldName}] 角色加载成功` : '全部角色列表加载成功', { 
				worldId: world?.id, 
				count: rs.length, 
				roles: rs 
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : '加载角色列表失败';
			setRoleError(message);
			logger.error('加载角色列表失败', { error });
		} finally {
			setIsLoadingRoles(false);
		}
	};

	const handleCreateWorld = async () => {
		if (!currentWorldName.trim()) {
			setWorldError('请输入世界名称');
			return;
		}
		setWorldError(null);
		try {
			await createWorld({ name: currentWorldName.trim() });
			const ws = await fetchWorlds();
			setWorlds(ws);
		} catch (error) {
			const message = error instanceof Error ? error.message : '创建世界失败';
			setWorldError(message);
			logger.error('创建世界失败', { error });
		}
	};

	const handleCancelEdit = () => {
		setEditingRole(null);
		setCurrentRoleName('');
		setCurrentGptId(undefined);
		setCurrentSovId(undefined);
		setGptFile(null);
		setSovFile(null);
		setSelectedRoleVersion('');
		setRoleError(null);
	};

	const handleUpdateRole = async () => {
		if (!editingRole) return;
		if (!currentRoleName.trim()) {
			setRoleError('请输入角色名称');
			return;
		}
		const world = worlds.find((w) => w.name === currentWorldName) || null;
		if (!world) {
			setRoleError('请先选择世界');
			return;
		}
		setRoleError(null);
		setIsLoadingRoles(true);
		try {
			await updateRole({
				id: editingRole.id,
				name: currentRoleName.trim(),
				world_id: world.id,
				world_name: world.name,
				version: selectedRoleVersion || currentVersion || undefined,
				gpt_model_id: currentGptId,
				sov_model_id: currentSovId,
			});
			// 刷新全部角色列表
			const rs = await fetchRolesByWorld();
			setRoles(rs);
			// 清空并关闭
			handleCancelEdit();
			logger.info('角色更新成功', { roleId: editingRole.id });
		} catch (error) {
			const message = error instanceof Error ? error.message : '更新角色失败';
			setRoleError(message);
			logger.error('更新角色失败', { error });
		} finally {
			setIsLoadingRoles(false);
		}
	};

	const handleImportRole = async () => {
		if (!currentRoleName.trim()) {
			setRoleError('请输入角色名称');
			return;
		}
		const world = worlds.find((w) => w.name === currentWorldName) || null;
		if (!world) {
			setRoleError('请先选择世界');
			return;
		}
		if (!gptFile || !sovFile) {
			setRoleError('请上传 GPT 和 SOVITS 权重文件');
			return;
		}
		setRoleError(null);
		setIsLoadingRoles(true);
		try {
			const formData = new FormData();
			formData.append('name', currentRoleName.trim());
			formData.append('world_id', String(world.id));
			if (selectedRoleVersion) {
				formData.append('version', selectedRoleVersion);
			} else if (currentVersion) {
				formData.append('version', currentVersion);
			}
			formData.append('gpt_file', gptFile);
			formData.append('sov_file', sovFile);

			await importRole(formData);
			
			// 刷新全部角色列表
			const rs = await fetchRolesByWorld();
			setRoles(rs);
			
			handleCancelEdit();
			
			logger.info('角色导入成功', { name: currentRoleName, world: world.name });
		} catch (error) {
			const message = error instanceof Error ? error.message : '导入角色失败';
			setRoleError(message);
			logger.error('导入角色失败', { error });
		} finally {
			setIsLoadingRoles(false);
		}
	};

	const handleDeleteWorld = async (world: WorldInfo) => {
		if (!window.confirm(`确定要删除世界「${world.name}」吗？这会同时删除该世界下的全部角色目录和训练目录。`)) {
			return;
		}
		setWorldError(null);
		try {
			await deleteWorld({ id: world.id });
			const ws = await fetchWorlds();
			setWorlds(ws);
			if (currentWorldName === world.name) {
				setCurrentWorldName('');
				setRoles([]);
				setCurrentRoleName('');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : '删除世界失败';
			setWorldError(message);
			logger.error('删除世界失败', { error });
		}
	};

	const handleDeleteRole = async (role: RoleInfo) => {
		if (!window.confirm(`确定要删除角色「${role.name}」吗？`)) {
			return;
		}
		setRoleError(null);
		try {
			await deleteRole({ id: role.id });
			// 统一刷新全部角色列表
			const rs = await fetchRolesByWorld();
			setRoles(rs);
			logger.info('角色删除成功', { roleId: role.id, name: role.name });
		} catch (error) {
			const message = error instanceof Error ? error.message : '删除角色失败';
			setRoleError(message);
			logger.error('删除角色失败', { error });
		}
	};

	const handleTabChange = async (tab: 'versions' | 'worlds' | 'roles') => {
		setActiveTab(tab);
		if (tab === 'versions') {
			await applyVersion(currentVersion);
		} else if (tab === 'worlds') {
			return;
		} else if (tab === 'roles') {
			await applyWorld(currentWorldName || '');
		}
	};

	return (
		<MainLayout
			currentView={AppView.MANAGEMENT}
			title="资源管理"
			hideHeader
		>
			<div className="h-full glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden tech-border">
				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="h-full flex flex-col">
						<div className="flex-1 min-h-0 overflow-hidden">
							{activeTab === 'versions' && (
								<VersionsPage
									versions={versions}
									selectedVersion={currentVersion}
									onVersionChange={applyVersion}
									roles={roles}
									onDeleteRole={handleDeleteRole}
								/>
							)}

							{activeTab === 'worlds' && (
								<WorldsPage
									worlds={worlds}
									onDeleteWorld={handleDeleteWorld}
									worldInput={currentWorldName}
									onWorldInputChange={setCurrentWorldName}
									onCreateWorld={handleCreateWorld}
									worldError={worldError}
									isLoadingWorlds={isLoadingWorlds}
									activeTab={activeTab === 'roles' ? 'roles' : 'worlds'}
									onTabChange={(tab) => handleTabChange(tab)}
								/>
							)}

							{activeTab === 'roles' && (
								<RolesPage
									roles={roles}
									activeTab="roles"
									onTabChange={(tab) => handleTabChange(tab)}
									onDeleteRole={handleDeleteRole}
									onEditRole={(role) => {
										setEditingRole(role);
										setCurrentRoleName(role.name);
										setCurrentWorldName(role.world_name || '');
										setCurrentGptId(role.gpt_model_id || role.gpt_model?.id);
										setCurrentSovId(role.sov_model_id || role.sov_model?.id);
										setSelectedRoleVersion(role.version || '');
										setIsImportMode(false); // 编辑模式暂不支持导入模式
										logger.info('准备编辑角色', { role });
									}}
									onUpdateRole={handleUpdateRole}
									onImportRole={handleImportRole}
									roleInput={currentRoleName}
									onRoleInputChange={setCurrentRoleName}
									roleError={roleError}
									isLoadingRoles={isLoadingRoles}
									worlds={worlds}
									versions={versions}
									currentRoleWorldName={currentWorldName}
									onRoleWorldChange={(value) => applyWorld(value, { preserveRoleDraft: true })}
									gptFile={gptFile}
									onGptFileChange={setGptFile}
									sovFile={sovFile}
									onSovFileChange={setSovFile}
									selectedVersion={selectedRoleVersion}
									onVersionChange={setSelectedRoleVersion}
									isEditing={!!editingRole}
									onCancelEdit={handleCancelEdit}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
};

export default ManagementDashboard;
