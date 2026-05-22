import React from 'react';
import { Search, Plus } from 'lucide-react';
import CustomSelect from '../../../../Emotion/Components/CustomSelect';

interface WorldHeaderProps {
	worldQuery: string;
	onQueryChange: (query: string) => void;
	onAddClick: () => void;
	activeTab: 'worlds' | 'roles';
	onTabChange: (tab: 'worlds' | 'roles') => void;
}

const WorldHeader: React.FC<WorldHeaderProps> = ({
	worldQuery,
	onQueryChange,
	onAddClick,
	activeTab,
	onTabChange,
}) => {
	return (
		<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 px-2">
			<div className="relative w-full lg:flex-1 lg:max-w-xl group">
				<div className="theme-kicker absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--color-amber-500)] transition-colors">
					<Search className="w-4 h-4" />
				</div>
				<input
					type="text"
					value={worldQuery}
					onChange={(e) => onQueryChange(e.target.value)}
					placeholder="搜索世界名称、版本或描述..."
					className="theme-input w-full pl-11 pr-4 py-2 rounded-xl transition-all text-sm"
				/>
			</div>

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:shrink-0">
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
					className="theme-button-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl transition-all active:scale-95 font-bold text-sm shrink-0"
				>
					<Plus className="w-4 h-4" />
					<span>新增世界</span>
				</button>
			</div>
		</div>
	);
};

export default WorldHeader;
