import React, { useState } from 'react';
import { Globe2 } from 'lucide-react';
import { WorldInfo } from '../../types';
import WorldEditCard from '../../Components/WorldEditCard';
import WorldHeader from './Components/WorldHeader';
import WorldCard from './Components/WorldCard';

interface WorldsPageProps {
	worlds: WorldInfo[];
	onDeleteWorld: (world: WorldInfo) => void;
	worldInput: string;
	onWorldInputChange: (value: string) => void;
	onCreateWorld: () => void;
	worldError: string | null;
	isLoadingWorlds: boolean;
	activeTab: 'worlds' | 'roles';
	onTabChange: (tab: 'worlds' | 'roles') => void;
}

const WorldsPage: React.FC<WorldsPageProps> = ({
	worlds,
	onDeleteWorld,
	worldInput,
	onWorldInputChange,
	onCreateWorld,
	worldError,
	isLoadingWorlds,
	activeTab,
	onTabChange,
}) => {
	const [worldQuery, setWorldQuery] = useState('');
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const worldFilter = worldQuery.toLowerCase();
	const filteredWorlds = worlds.filter((w) => {
		const name = w.name.toLowerCase();
		const version = (w.version || '').toLowerCase();
		const description = (w.description || '').toLowerCase();
		return name.includes(worldFilter) || version.includes(worldFilter) || description.includes(worldFilter);
	});

	return (
		<div className="flex flex-col gap-6 h-full">
			<WorldHeader
				worldQuery={worldQuery}
				onQueryChange={setWorldQuery}
				onAddClick={() => setIsCreateModalOpen(true)}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>

			{/* World List Container */}
			<div className="theme-world-list-surface flex-1 overflow-y-auto pr-2 pl-3 pt-3 pb-1 custom-scrollbar min-h-0 rounded-[28px]">
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-6">
					{filteredWorlds.map((world) => (
						<WorldCard
							key={world.id}
							world={world}
							onDelete={onDeleteWorld}
						/>
					))}

					{filteredWorlds.length === 0 && (
						<div className="theme-empty-state col-span-full py-20 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed">
							<div className="theme-card p-6 rounded-3xl mb-4">
								<Globe2 className="theme-kicker w-12 h-12" />
							</div>
							<p className="theme-title text-base font-bold">暂无符合条件的世界</p>
							<p className="theme-subtitle text-sm mt-2 font-medium">先创建世界，再往下挂角色和模型。</p>
						</div>
					)}
				</div>
			</div>

			{/* Modal */}
			<WorldEditCard
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				worldInput={worldInput}
				onWorldInputChange={onWorldInputChange}
				onCreateWorld={onCreateWorld}
				worldError={worldError}
				isLoadingWorlds={isLoadingWorlds}
			/>
		</div>
	);
};

export default WorldsPage;
