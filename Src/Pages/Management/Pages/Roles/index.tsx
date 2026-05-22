import React, { useState } from 'react';
import { RoleInfo, WorldInfo, ModelInfo, VersionInfo } from '../../types';
import RoleEditCard from '../../Components/RoleEditCard';
import RoleCreateCard from '../../Components/RoleCreateCard';
import RoleHeader from './Components/RoleHeader';
import RoleList from './Components/RoleList';

interface RolesPageProps {
	roles: RoleInfo[];
	activeTab: 'worlds' | 'roles';
	onTabChange: (tab: 'worlds' | 'roles') => void;
	onDeleteRole: (role: RoleInfo) => void;
	onEditRole?: (role: RoleInfo) => void;
	onUpdateRole?: () => void;
	roleInput: string;
	onRoleInputChange: (value: string) => void;
	onImportRole: () => void;
	roleError: string | null;
	isLoadingRoles: boolean;
	worlds: WorldInfo[];
	versions: VersionInfo[];
	currentRoleWorldName: string;
	onRoleWorldChange: (value: string) => void;
	gptFile: File | null;
	onGptFileChange: (file: File | null) => void;
	sovFile: File | null;
	onSovFileChange: (file: File | null) => void;
	selectedVersion: string;
	onVersionChange: (value: string) => void;
	isEditing: boolean;
	onCancelEdit?: () => void;
}

const RolesPage: React.FC<RolesPageProps> = ({
	roles,
	activeTab,
	onTabChange,
	onDeleteRole,
	onEditRole,
	onUpdateRole,
	roleInput,
	onRoleInputChange,
	gptInputId,
	onGptInputChange,
	sovInputId,
	onSovInputChange,
	onImportRole,
	roleError,
	isLoadingRoles,
	worlds,
	versions,
	currentRoleWorldName,
	onRoleWorldChange,
	gptModels,
	sovModels,
	gptFile,
	onGptFileChange,
	sovFile,
	onSovFileChange,
	selectedVersion,
	onVersionChange,
	isEditing,
	onCancelEdit,
}) => {
	const [roleQuery, setRoleQuery] = useState('');
	const [filterWorld, setFilterWorld] = useState<string>('all');
	const [filterVersion, setFilterVersion] = useState<string>('all');
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const roleFilter = roleQuery.toLowerCase();
	const filteredRoles = roles.filter((r) => {
		const name = r.name.toLowerCase();
		const worldName = (r.world_name || '').toLowerCase();
		const version = (r.version || '').toLowerCase();
		const gptName = (r.gpt_model_name || r.gpt_model?.name || '').toLowerCase();
		const sovName = (r.sov_model_name || r.sov_model?.name || '').toLowerCase();
		
		const matchesQuery = name.includes(roleFilter) || 
			worldName.includes(roleFilter) || 
			version.includes(roleFilter) ||
			gptName.includes(roleFilter) ||
			sovName.includes(roleFilter);
			
		const matchesWorld = filterWorld === 'all' || r.world_name === filterWorld;
		const matchesVersion = filterVersion === 'all' || r.version === filterVersion;
		
		return matchesQuery && matchesWorld && matchesVersion;
	});

	const handleEditClick = (role: RoleInfo) => {
		onEditRole?.(role);
		setIsEditModalOpen(true);
	};

	const handleUpdateRole = async () => {
		await onUpdateRole?.();
		if (!roleError) {
			setIsEditModalOpen(false);
		}
	};

	const handleImportRole = async () => {
		await onImportRole();
		if (!roleError) {
			setIsCreateModalOpen(false);
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div className="shrink-0 mb-4">
				<RoleHeader
					activeTab={activeTab}
					onTabChange={onTabChange}
					roleQuery={roleQuery}
					onQueryChange={setRoleQuery}
					filterWorld={filterWorld}
					onWorldChange={setFilterWorld}
					filterVersion={filterVersion}
					onVersionChange={setFilterVersion}
					worlds={worlds}
					versions={versions}
					onReset={() => {
						setFilterWorld('all');
						setFilterVersion('all');
						setRoleQuery('');
					}}
					showReset={filterWorld !== 'all' || filterVersion !== 'all' || roleQuery !== ''}
					onAddClick={() => setIsCreateModalOpen(true)}
				/>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
				<RoleList
					roles={filteredRoles}
					gptModels={gptModels}
					sovModels={sovModels}
					onEditRole={handleEditClick}
					onDeleteRole={onDeleteRole}
				/>
			</div>

			{/* Create Role Modal */}
			<RoleCreateCard
				isOpen={isCreateModalOpen}
				onClose={() => {
					setIsCreateModalOpen(false);
					onCancelEdit?.();
				}}
				roleInput={roleInput}
				onRoleInputChange={onRoleInputChange}
				onImportRole={handleImportRole}
				roleError={roleError}
				isLoadingRoles={isLoadingRoles}
				worlds={worlds}
				versions={versions}
				currentRoleWorldName={currentRoleWorldName}
				onRoleWorldChange={onRoleWorldChange}
				gptFile={gptFile}
				onGptFileChange={onGptFileChange}
				sovFile={sovFile}
				onSovFileChange={onSovFileChange}
				selectedVersion={selectedVersion}
				onVersionChange={onVersionChange}
			/>

			{/* Edit Role Modal */}
			<RoleEditCard
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					onCancelEdit?.();
				}}
				roleInput={roleInput}
				onRoleInputChange={onRoleInputChange}
				gptInputId={gptInputId}
				onGptInputChange={onGptInputChange}
				sovInputId={sovInputId}
				onSovInputChange={onSovInputChange}
				onSaveRole={handleUpdateRole}
				roleError={roleError}
				isLoadingRoles={isLoadingRoles}
				worlds={worlds}
				versions={versions}
				currentRoleWorldName={currentRoleWorldName}
				onRoleWorldChange={onRoleWorldChange}
				gptModels={gptModels}
				sovModels={sovModels}
				selectedVersion={selectedVersion}
				onVersionChange={onVersionChange}
			/>
		</div>
	);
};

export default RolesPage;
