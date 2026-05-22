import React from 'react';
import { Users } from 'lucide-react';
import { RoleInfo, ModelInfo } from '../../../types';
import RoleCard from './RoleCard';

interface RoleListProps {
	roles: RoleInfo[];
	gptModels: ModelInfo[];
	sovModels: ModelInfo[];
	onEditRole: (role: RoleInfo) => void;
	onDeleteRole: (role: RoleInfo) => void;
}

const RoleList: React.FC<RoleListProps> = ({
	roles,
	gptModels,
	sovModels,
	onEditRole,
	onDeleteRole,
}) => {
	return (
		<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
			<div className="grid grid-cols-1 gap-4 pt-3 pb-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
				{roles.map((role) => (
					<RoleCard
						key={role.id}
						role={role}
						gptModels={gptModels}
						sovModels={sovModels}
						onEdit={onEditRole}
						onDelete={onDeleteRole}
					/>
				))}

				{roles.length === 0 && (
					<div className="theme-empty-state col-span-full py-20 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed">
						<div className="theme-card p-6 rounded-3xl mb-4">
							<Users className="theme-kicker w-12 h-12" />
						</div>
						<p className="theme-title text-base font-bold">暂无符合条件的角色数据</p>
						<p className="theme-subtitle text-sm mt-2 font-medium">点击右上角按钮导入一个吧</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default RoleList;
