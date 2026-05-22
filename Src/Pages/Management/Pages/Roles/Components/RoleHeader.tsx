import React from 'react';
import { Search, Plus } from 'lucide-react';
import { WorldInfo, VersionInfo } from '../../../types';
import CustomSelect from '../../../../Emotion/Components/CustomSelect';

interface RoleHeaderProps {
	activeTab: 'worlds' | 'roles';
	onTabChange: (tab: 'worlds' | 'roles') => void;
	// Search props
	roleQuery: string;
	onQueryChange: (query: string) => void;
	// Filter props
	filterWorld: string;
	onWorldChange: (world: string) => void;
	filterVersion: string;
	onVersionChange: (version: string) => void;
	worlds: WorldInfo[];
	versions: VersionInfo[];
	onReset: () => void;
	showReset: boolean;
	// Action props
	onAddClick: () => void;
}

const RoleHeader: React.FC<RoleHeaderProps> = ({
	activeTab,
	onTabChange,
	roleQuery,
	onQueryChange,
	filterWorld,
	onWorldChange,
	filterVersion,
	onVersionChange,
	worlds,
	versions,
	onReset,
	showReset,
	onAddClick,
}) => {
	return (
		<div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-2">
			<div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full lg:w-auto">
				{/* Search Box */}
				<div className="relative w-full md:max-w-xs group">
					<div className="theme-kicker absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--color-amber-500)] transition-colors">
						<Search className="w-4 h-4" />
					</div>
					<input
						type="text"
						value={roleQuery}
						onChange={(e) => onQueryChange(e.target.value)}
						placeholder="搜索角色..."
						className="theme-input w-full pl-11 pr-4 py-2 rounded-xl transition-all text-sm"
					/>
				</div>

				{/* Filters */}
				<div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
					<div className="flex items-center gap-1.5">
						<select
							value={filterWorld}
							onChange={(e) => onWorldChange(e.target.value)}
							className="theme-input text-[11px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer min-w-[100px]"
						>
							<option value="all">所有世界</option>
							{worlds.map(w => (
								<option key={w.id} value={w.name}>{w.name}</option>
							))}
						</select>
					</div>

					<div className="flex items-center gap-1.5">
						<select
							value={filterVersion}
							onChange={(e) => onVersionChange(e.target.value)}
							className="theme-input text-[11px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer min-w-[100px]"
						>
							<option value="all">所有版本</option>
							{versions.map(v => (
								<option key={v.name} value={v.name}>{v.name}</option>
							))}
						</select>
					</div>

					{showReset && (
						<button
							onClick={onReset}
							className="theme-accent-text text-[10px] font-bold underline underline-offset-2 transition-colors px-2"
						>
							重置
						</button>
					)}
				</div>
			</div>

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
				<CustomSelect
					label=""
					value={activeTab}
					options={[
						{ id: 'worlds', name: '世界管理' },
						{ id: 'roles', name: '角色与模型' }
					]}
					onChange={(value) => onTabChange(value as 'worlds' | 'roles')}
					align="right"
					variant="filled"
				/>

				<button
					onClick={onAddClick}
					className="theme-button-primary w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl transition-all active:scale-95 font-bold text-sm shrink-0"
				>
					<Plus className="w-4 h-4" />
					<span>导入角色</span>
				</button>
			</div>
		</div>
	);
};

export default RoleHeader;
