import React from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Globe2, Cpu, Zap, AlertCircle, Loader2, Edit2, Settings2 } from 'lucide-react';
import { WorldInfo, ModelInfo, VersionInfo } from '../types';

interface RoleEditCardProps {
	isOpen: boolean;
	onClose: () => void;
	roleInput: string;
	onRoleInputChange: (value: string) => void;
	gptInputId: number | undefined;
	onGptInputChange: (id: number | undefined) => void;
	sovInputId: number | undefined;
	onSovInputChange: (id: number | undefined) => void;
	onSaveRole: () => void;
	roleError: string | null;
	isLoadingRoles: boolean;
	worlds: WorldInfo[];
	currentRoleWorldName: string;
	onRoleWorldChange: (value: string) => void;
	gptModels: ModelInfo[];
	sovModels: ModelInfo[];
	versions: VersionInfo[];
	selectedVersion: string;
	onVersionChange: (value: string) => void;
}

const RoleEditCard: React.FC<RoleEditCardProps> = ({
	isOpen,
	onClose,
	roleInput,
	onRoleInputChange,
	gptInputId,
	onGptInputChange,
	sovInputId,
	onSovInputChange,
	onSaveRole,
	roleError,
	isLoadingRoles,
	worlds,
	currentRoleWorldName,
	onRoleWorldChange,
	gptModels,
	sovModels,
	versions,
	selectedVersion,
	onVersionChange,
}) => {
	if (!isOpen) return null;

	return createPortal(
		<div className="theme-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
			<div 
				className="theme-section theme-frost-gradient w-full max-w-lg rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-200"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="theme-section-soft px-8 py-6 border-b flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="theme-button-primary p-2.5 rounded-2xl">
							<Edit2 className="w-5 h-5" />
						</div>
						<div>
							<h3 className="theme-title text-lg font-bold">编辑角色</h3>
							<p className="theme-kicker text-[10px] font-mono tracking-widest uppercase">Update Role Info</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						className="theme-button-ghost p-2 rounded-xl transition-colors shadow-sm"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
					{/* Name Input */}
					<div className="space-y-2">
						<label className="theme-title text-xs font-bold flex items-center gap-2">
							<Users className="theme-accent-text w-3.5 h-3.5" />
							角色名称
						</label>
						<input
							type="text"
							value={roleInput}
							onChange={(e) => onRoleInputChange(e.target.value)}
							placeholder="给你的角色起个名字..."
							className="theme-input w-full px-5 py-3 rounded-2xl transition-all text-sm font-medium"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{/* World Selection */}
						<div className="space-y-2">
							<label className="theme-title text-xs font-bold flex items-center gap-2">
								<Globe2 className="theme-info-text w-3.5 h-3.5" />
								所属世界
							</label>
							<select
								value={currentRoleWorldName || ''}
								onChange={(e) => onRoleWorldChange(e.target.value)}
								className="theme-input w-full px-5 py-3 rounded-2xl transition-all text-sm font-medium appearance-none cursor-pointer"
							>
								<option value="">选择世界...</option>
								{worlds.map(w => (
									<option key={w.id} value={w.name}>{w.name}</option>
								))}
							</select>
						</div>

						{/* Version Selection */}
						<div className="space-y-2">
							<label className="theme-title text-xs font-bold flex items-center gap-2">
								<Settings2 className="theme-status-success w-3.5 h-3.5" />
								基础版本
							</label>
							<select
								value={selectedVersion}
								onChange={(e) => onVersionChange(e.target.value)}
								className="theme-input w-full px-5 py-3 rounded-2xl transition-all text-sm font-medium appearance-none cursor-pointer"
							>
								<option value="">选择基础版本...</option>
								{versions.map(v => (
									<option key={v.name} value={v.name}>{v.name}</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
						{/* GPT Model */}
						<div className="space-y-2">
							<label className="theme-title text-xs font-bold flex items-center gap-2">
								<Cpu className="theme-info-text w-3.5 h-3.5" />
								GPT 模型
							</label>
							<select
								value={gptInputId || ''}
								onChange={(e) => onGptInputChange(e.target.value ? Number(e.target.value) : undefined)}
								className="theme-input w-full px-5 py-3 rounded-2xl transition-all text-sm font-medium appearance-none cursor-pointer"
							>
								<option value="">选择 GPT...</option>
								{gptModels.map(m => (
									<option key={m.id} value={m.id}>{m.name}</option>
								))}
							</select>
						</div>

						{/* SOVITS Model */}
						<div className="space-y-2">
							<label className="theme-title text-xs font-bold flex items-center gap-2">
								<Zap className="theme-accent-text w-3.5 h-3.5" />
								SOVITS 模型
							</label>
							<select
								value={sovInputId || ''}
								onChange={(e) => onSovInputChange(e.target.value ? Number(e.target.value) : undefined)}
								className="theme-input w-full px-5 py-3 rounded-2xl transition-all text-sm font-medium appearance-none cursor-pointer"
							>
								<option value="">选择 SOVITS...</option>
								{sovModels.map(m => (
									<option key={m.id} value={m.id}>{m.name}</option>
								))}
							</select>
						</div>
					</div>

					{roleError && (
						<div className="theme-status-block-danger flex items-center gap-2 p-4 rounded-2xl animate-in slide-in-from-top-2">
							<AlertCircle className="w-4 h-4 flex-shrink-0" />
							<p className="text-xs font-bold">{roleError}</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="theme-section-soft px-8 py-6 border-t flex items-center justify-end gap-3">
					<button
						onClick={onClose}
						className="theme-button-ghost px-6 py-2.5 text-sm font-bold transition-colors"
					>
						取消
					</button>
					<button
						onClick={onSaveRole}
						disabled={isLoadingRoles || !roleInput.trim() || !currentRoleWorldName}
						className="theme-button-primary flex items-center gap-2 px-8 py-2.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 font-bold text-sm"
					>
						{isLoadingRoles ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>保存中...</span>
							</>
						) : (
							<>
								<Edit2 className="w-4 h-4" />
								<span>保存修改</span>
							</>
						)}
					</button>
				</div>
			</div>
			
			{/* Backdrop Close */}
			<div className="absolute inset-0 -z-10" onClick={onClose} />
		</div>,
		document.body
	);
};

export default RoleEditCard;
