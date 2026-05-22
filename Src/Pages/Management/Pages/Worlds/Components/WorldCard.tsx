import React from 'react';
import { Globe2, Trash2 } from 'lucide-react';
import { WorldInfo } from '../../../types';

interface WorldCardProps {
	world: WorldInfo;
	onDelete: (world: WorldInfo) => void;
}

const WorldCard: React.FC<WorldCardProps> = ({ world, onDelete }) => {
	return (
		<div className="theme-world-card group min-h-[196px] p-6 rounded-2xl hover:border-[var(--color-amber-400)] hover:shadow-[var(--shadow-amber)] transition-all flex flex-col justify-between relative overflow-hidden">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="theme-section-soft p-3.5 rounded-xl transition-colors">
						<Globe2 className="theme-kicker w-5.5 h-5.5 group-hover:text-[var(--color-amber-500)]" />
					</div>
					<div className="min-w-0">
						<h4 className="theme-title font-bold text-[1.125rem] leading-tight truncate">{world.name}</h4>
						<div className="flex items-center gap-2 mt-1.5">
							<span className="theme-tag text-[11px] font-mono px-2 py-0.5 rounded uppercase tracking-wider">
								#{world.id}
							</span>
							{world.version && (
								<span className="theme-tag-amber text-[11px] font-bold px-2 py-0.5 rounded truncate max-w-[120px]">
									{world.version}
								</span>
							)}
						</div>
					</div>
				</div>
				<button
					type="button"
					onClick={() => onDelete(world)}
					className="theme-button-danger-ghost p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
					title="删除世界"
				>
					<Trash2 className="w-3.5 h-3.5" />
				</button>
			</div>

			{world.description && (
				<p className="theme-subtitle text-sm line-clamp-3 mb-5 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
					{world.description}
				</p>
			)}

			<div className="theme-divider pt-3.5 border-t flex items-center justify-between">
				<div className="theme-kicker text-[11px] flex items-center gap-1.5">
					<div className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber-400)]" />
					<span>World</span>
				</div>
				<div className="text-[11px] font-bold text-[var(--color-gray-300)] group-hover:text-[var(--color-amber-500)] transition-colors uppercase tracking-widest">
					Details
				</div>
			</div>
			
			{/* Decorative background element */}
			<div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity">
				<Globe2 className="w-20 h-20 rotate-12" />
			</div>
		</div>
	);
};

export default WorldCard;
