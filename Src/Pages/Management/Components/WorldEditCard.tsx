import React from 'react';
import { createPortal } from 'react-dom';
import { X, Globe2, Loader2 } from 'lucide-react';

interface WorldEditCardProps {
	isOpen: boolean;
	onClose: () => void;
	worldInput: string;
	onWorldInputChange: (value: string) => void;
	onCreateWorld: () => void;
	worldError: string | null;
	isLoadingWorlds: boolean;
}

const WorldEditCard: React.FC<WorldEditCardProps> = ({
	isOpen,
	onClose,
	worldInput,
	onWorldInputChange,
	onCreateWorld,
	worldError,
	isLoadingWorlds,
}) => {
	if (!isOpen) return null;

	const handleCreate = async () => {
		await onCreateWorld();
		if (!worldError) {
			onClose();
		}
	};

	return createPortal(
		<div className="theme-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
			<div 
				className="theme-section theme-frost-gradient w-full max-w-md rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="theme-section-soft px-6 py-5 border-b flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="theme-button-primary p-2 rounded-xl">
							<Globe2 className="w-5 h-5" />
						</div>
						<div>
							<h3 className="theme-title text-lg font-bold">新增世界</h3>
							<p className="theme-kicker text-[10px] font-mono">CREATE NEW WORLD</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						className="theme-button-ghost p-2 rounded-full transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-4">
					<div className="space-y-2">
						<label className="theme-kicker text-[11px] font-bold uppercase tracking-wider px-1">
							世界名称
						</label>
						<div className="relative">
							<input
								type="text"
								value={worldInput}
								onChange={(e) => onWorldInputChange(e.target.value)}
								placeholder="输入新世界名称..."
								autoFocus
								onKeyDown={(e) => {
									if (e.key === 'Enter' && worldInput.trim()) {
										handleCreate();
									}
								}}
								className={`theme-input w-full px-4 py-3 rounded-2xl transition-all text-sm font-medium ${
									worldError ? 'theme-input-error' : ''
								}`}
							/>
							{worldError && (
								<p className="theme-status-danger mt-1.5 text-[10px] font-medium px-1 animate-in slide-in-from-top-1">
									{worldError}
								</p>
							)}
						</div>
						<p className="theme-kicker text-[10px] px-1 italic">
							* 世界是角色所属的背景设定，建议使用具有辨识度的名称。
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className="theme-section-soft px-6 py-5 border-t flex gap-3">
					<button
						type="button"
						onClick={onClose}
						className="theme-button-secondary flex-1 px-4 py-2.5 rounded-xl transition-all text-sm font-bold"
					>
						取消
					</button>
					<button
						type="button"
						onClick={handleCreate}
						disabled={isLoadingWorlds || !worldInput.trim()}
						className="theme-button-primary flex-[2] px-4 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center gap-2"
					>
						{isLoadingWorlds ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							'确认创建'
						)}
					</button>
				</div>
			</div>
			{/* Backdrop click to close */}
			<div className="absolute inset-0 -z-10" onClick={onClose} />
		</div>,
		document.body
	);
};

export default WorldEditCard;
