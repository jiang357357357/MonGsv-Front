import React from 'react';
import { Users, Globe2, Edit2, Trash2, Cpu, Zap, Languages } from 'lucide-react';
import { RoleInfo, ModelInfo } from '../../../types';

interface RoleCardProps {
	role: RoleInfo;
	gptModels: ModelInfo[];
	sovModels: ModelInfo[];
	onEdit: (role: RoleInfo) => void;
	onDelete: (role: RoleInfo) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
	role,
	gptModels,
	sovModels,
	onEdit,
	onDelete,
}) => {
	const gptModelFromList = gptModels.find(m => m.id === (role.gpt_model_id || role.gpt_model?.id));
	const sovModelFromList = sovModels.find(m => m.id === (role.sov_model_id || role.sov_model?.id));
	
	const gptDisplayName = role.gpt_model_name || role.gpt_model?.name || gptModelFromList?.name;
	const sovDisplayName = role.sov_model_name || role.sov_model?.name || sovModelFromList?.name;
	
	const hasGpt = role.gpt_model_id || role.gpt_model?.id;
	const hasSov = role.sov_model_id || role.sov_model?.id;

	return (
		<div className="theme-card group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[1.75rem] border-2 border-[var(--color-border-strong)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.72)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-amber-400)]">
			<div className="mb-4 flex items-start justify-between">
				<div className="flex items-center gap-3">
					<div className="theme-section-soft rounded-2xl border border-[var(--color-border-default)] p-3 transition-colors">
						<Users className="theme-kicker h-[18px] w-[18px] group-hover:text-[var(--color-amber-500)]" />
					</div>
					<div className="min-w-0">
						<h4 className="theme-title truncate text-[1.05rem] font-black leading-tight">{role.name}</h4>
						<div className="mt-1.5 flex items-center gap-2">
							<span className="theme-tag-amber flex max-w-[120px] items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold">
								<Globe2 className="h-2.5 w-2.5 shrink-0" />
								{role.world_name}
							</span>
						</div>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
					<button
						type="button"
						onClick={() => onEdit(role)}
						className="theme-button-ghost rounded-xl p-2 transition-all"
						title="编辑角色"
					>
						<Edit2 className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => onDelete(role)}
						className="theme-button-danger-ghost rounded-xl p-2 transition-all"
						title="删除角色"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			</div>

			<div className="mb-4 space-y-2.5">
				{/* GPT Model */}
				<div className={`flex min-h-[48px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[11px] font-medium transition-colors ${
					hasGpt 
						? 'theme-tag-blue'
						: 'theme-tag opacity-60'
				}`}>
					<Cpu className="h-3 w-3 shrink-0" />
					<span className="truncate font-bold">
						{gptDisplayName || (hasGpt ? `GPT #${hasGpt}` : '未关联')}
					</span>
				</div>

				{/* SOV Model */}
				<div className={`flex min-h-[48px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[11px] font-medium transition-colors ${
					hasSov 
						? 'text-[var(--color-blue-500)] bg-[rgba(220,238,254,0.5)] border-[rgba(94,153,216,0.22)]'
						: 'theme-tag opacity-60'
				}`}>
					<Zap className="h-3 w-3 shrink-0" />
					<span className="truncate font-bold">
						{sovDisplayName || (hasSov ? `SOV #${hasSov}` : '未关联')}
					</span>
				</div>

				{role.language && (
					<div className="theme-status-success flex min-h-[48px] items-center gap-2.5 rounded-xl border border-[rgba(35,136,87,0.18)] bg-[rgba(238,249,241,0.72)] px-3 py-2.5 text-[11px] font-medium">
						<Languages className="h-3 w-3 shrink-0" />
						<span className="truncate font-bold uppercase">{role.language}</span>
					</div>
				)}
			</div>

			<div className="theme-divider flex items-center justify-between border-t border-[var(--color-border-default)] pt-3">
				<div className="theme-kicker flex items-center gap-1.5 text-[11px]">
					<div className="theme-status-dot-success h-1.5 w-1.5 rounded-full" />
					<span>Active</span>
				</div>
				<div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-gray-300)] transition-colors group-hover:text-[var(--color-amber-500)]">
					Profile
				</div>
			</div>
			
			{/* Decorative background element */}
			<div className="absolute -bottom-4 -right-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.05]">
				<Users className="h-20 w-20 rotate-12" />
			</div>
		</div>
	);
};

export default RoleCard;
