import React from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Globe2, AlertCircle, Loader2, Upload, Database, Settings2 } from 'lucide-react';
import { WorldInfo, VersionInfo } from '../types';

interface RoleCreateCardProps {
	isOpen: boolean;
	onClose: () => void;
	roleInput: string;
	onRoleInputChange: (value: string) => void;
	onImportRole: () => void;
	roleError: string | null;
	isLoadingRoles: boolean;
	worlds: WorldInfo[];
	currentRoleWorldName: string;
	onRoleWorldChange: (value: string) => void;
	gptFile: File | null;
	onGptFileChange: (file: File | null) => void;
	sovFile: File | null;
	onSovFileChange: (file: File | null) => void;
	versions: VersionInfo[];
	selectedVersion: string;
	onVersionChange: (value: string) => void;
}

const RoleCreateCard: React.FC<RoleCreateCardProps> = ({
	isOpen,
	onClose,
	roleInput,
	onRoleInputChange,
	onImportRole,
	roleError,
	isLoadingRoles,
	worlds,
	currentRoleWorldName,
	onRoleWorldChange,
	gptFile,
	onGptFileChange,
	sovFile,
	onSovFileChange,
	versions,
	selectedVersion,
	onVersionChange,
}) => {
	if (!isOpen) return null;

	const gptInputRef = React.useRef<HTMLInputElement>(null);
	const sovInputRef = React.useRef<HTMLInputElement>(null);

	return createPortal(
		<div className="theme-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
			<div
				className="theme-section theme-frost-gradient w-full max-w-lg rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-200"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="theme-section-soft px-8 py-6 border-b flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="theme-button-primary p-2.5 rounded-2xl">
							<Upload className="w-5 h-5" />
						</div>
						<div>
							<h3 className="theme-title text-lg font-bold">导入角色</h3>
							<p className="theme-kicker text-[10px] font-mono tracking-widest uppercase">
								Import Role As New Entry
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="theme-button-ghost p-2 rounded-xl transition-colors shadow-sm"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
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
								{worlds.map((world) => (
									<option key={world.id} value={world.name}>
										{world.name}
									</option>
								))}
							</select>
						</div>

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
								{versions.map((version) => (
									<option key={version.name} value={version.name}>
										{version.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
						<div className="space-y-2">
							<label className="theme-title text-xs font-bold flex items-center gap-2">
								<Database className="theme-info-text w-3.5 h-3.5" />
								GPT 权重 (.ckpt)
							</label>
							<div
								onClick={() => gptInputRef.current?.click()}
								className={`group relative flex h-28 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed p-4 transition-all ${
									gptFile
										? 'theme-status-block-info border-[rgba(94,153,216,0.18)]'
										: 'theme-upload-zone'
								}`}
							>
								<input
									type="file"
									ref={gptInputRef}
									className="hidden"
									accept=".ckpt"
									onChange={(e) => onGptFileChange(e.target.files?.[0] || null)}
								/>
								<Upload
									className={`mb-1.5 w-6 h-6 transition-transform group-hover:-translate-y-1 ${
										gptFile ? 'theme-info-text' : 'text-[var(--color-gray-300)]'
									}`}
								/>
								<span className="theme-subtitle text-[10px] font-bold text-center line-clamp-2 px-2">
									{gptFile ? gptFile.name : '点击上传 GPT'}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<label className="theme-title text-xs font-bold flex items-center gap-2">
								<Database className="theme-accent-text w-3.5 h-3.5" />
								SOVITS 权重 (.pth)
							</label>
							<div
								onClick={() => sovInputRef.current?.click()}
								className={`group relative flex h-28 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed p-4 transition-all ${
									sovFile
										? 'theme-status-block-warning border-[rgba(197,126,22,0.18)]'
										: 'theme-upload-zone'
								}`}
							>
								<input
									type="file"
									ref={sovInputRef}
									className="hidden"
									accept=".pth"
									onChange={(e) => onSovFileChange(e.target.files?.[0] || null)}
								/>
								<Upload
									className={`mb-1.5 w-6 h-6 transition-transform group-hover:-translate-y-1 ${
										sovFile ? 'theme-accent-text' : 'text-[var(--color-gray-300)]'
									}`}
								/>
								<span className="theme-subtitle text-[10px] font-bold text-center line-clamp-2 px-2">
									{sovFile ? sovFile.name : '点击上传 SOVITS'}
								</span>
							</div>
						</div>
					</div>

					{roleError && (
						<div className="theme-status-block-danger flex items-center gap-2 p-4 rounded-2xl animate-in slide-in-from-top-2">
							<AlertCircle className="w-4 h-4 flex-shrink-0" />
							<p className="text-xs font-bold">{roleError}</p>
						</div>
					)}
				</div>

				<div className="theme-section-soft px-8 py-6 border-t flex items-center justify-end gap-3">
					<button
						onClick={onClose}
						className="theme-button-ghost px-6 py-2.5 text-sm font-bold transition-colors"
					>
						取消
					</button>
					<button
						onClick={onImportRole}
						disabled={isLoadingRoles || !roleInput.trim() || !currentRoleWorldName || !gptFile || !sovFile}
						className="theme-button-primary flex items-center gap-2 px-8 py-2.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 font-bold text-sm"
					>
						{isLoadingRoles ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>导入中...</span>
							</>
						) : (
							<>
								<Upload className="w-4 h-4" />
								<span>确认导入</span>
							</>
						)}
					</button>
				</div>
			</div>

			<div className="absolute inset-0 -z-10" onClick={onClose} />
		</div>,
		document.body
	);
};

export default RoleCreateCard;
