import React, { useState } from 'react';
import { Database, Users, Trash2 } from 'lucide-react';
import { VersionInfo, RoleInfo } from '../../types';

interface VersionsPageProps {
	versions: VersionInfo[];
	selectedVersion: string | null;
	onVersionChange: (version: string) => void;
	roles: RoleInfo[];
	onDeleteRole: (role: RoleInfo) => void;
}

const VersionsPage: React.FC<VersionsPageProps> = ({
	versions,
	selectedVersion,
	onVersionChange,
	roles,
	onDeleteRole,
}) => {
	const [versionQuery, setVersionQuery] = useState('');
	const versionFilter = versionQuery.toLowerCase();
	const filteredVersions = versions.filter((v) => v.name.toLowerCase().includes(versionFilter));

	return (
		<div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
			{/* 左侧版本列表 */}
			<div className="w-full lg:w-72 flex flex-col min-h-0">
				{/* 固定头部：标题 + 搜索框 */}
				<div className="shrink-0 px-2 mb-3">
					<div className="flex items-center justify-between mb-2">
						<h4 className="theme-title text-sm font-bold">基础版本列表</h4>
						<span className="theme-kicker text-[10px] font-mono">{filteredVersions.length}</span>
					</div>
					<input
						type="text"
						value={versionQuery}
						onChange={(e) => setVersionQuery(e.target.value)}
						placeholder="搜索基础版本..."
						className="theme-input w-full px-3 py-1.5 rounded-lg text-xs transition-all"
					/>
				</div>
				{/* 滚动列表 */}
				<div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-3">
					{filteredVersions.map((version) => (
					<button
						key={`${version.source}-${version.name}`}
						onClick={() => onVersionChange(version.name)}
						className={`w-full text-left p-4 rounded-2xl border transition-all group ${
							selectedVersion === version.name
								? 'theme-button-primary shadow-lg'
								: 'theme-card theme-title hover:border-[var(--color-amber-400)]'
						}`}
					>
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<div className={`p-1.5 rounded-lg ${selectedVersion === version.name ? 'bg-[rgba(255,255,255,0.1)]' : 'theme-section-soft'}`}>
									<Database className={`w-4 h-4 ${selectedVersion === version.name ? 'text-[var(--color-text-inverse)]' : 'theme-kicker group-hover:text-[var(--color-amber-500)]'}`} />
								</div>
								<span className="font-bold text-sm truncate">{version.name}</span>
							</div>
							{version.isCurrent && (
								<span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${selectedVersion === version.name ? 'theme-amber-gradient' : 'theme-tag-amber'}`}>
									当前
								</span>
							)}
						</div>
						<div className="flex items-center gap-3">
							<div className={`flex items-center gap-1 text-[10px] ${selectedVersion === version.name ? 'opacity-60' : 'theme-kicker'}`}>
								<Database className="w-3 h-3" />
								<span>{version.source.toUpperCase()}</span>
							</div>
							{version.isDefault && (
								<div className="flex items-center gap-1 text-[10px] theme-accent-text font-medium">
									<span className="w-1 h-1 bg-[var(--color-amber-400)] rounded-full" />
									<span>默认</span>
								</div>
							)}
						</div>
					</button>
				))}
					{filteredVersions.length === 0 && (
						<div className="py-8 text-center theme-subtitle text-sm font-medium">
							未找到匹配版本
						</div>
					)}
				</div>
			</div>

			{/* 右侧角色模型列表 */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* 固定头部 */}
				<div className="shrink-0 flex items-center justify-between px-2 mb-3">
					<div className="flex items-center gap-2">
						<h4 className="theme-title text-sm font-bold">该基础版本下的角色</h4>
						{selectedVersion && (
							<span className="theme-tag px-2 py-0.5 text-[10px] rounded-md font-mono">
								{selectedVersion}
							</span>
						)}
					</div>
					<span className="theme-kicker text-[10px] font-mono">
						{roles.filter(r => r.version === selectedVersion).length} 条目
					</span>
				</div>

				{/* 滚动列表 */}
				<div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
					{roles
						.filter(r => r.version === selectedVersion)
						.map((role) => (
							<div
								key={role.id}
								className="theme-card group p-4 rounded-2xl hover:border-[var(--color-amber-400)] hover:shadow-[var(--shadow-amber)] transition-all flex items-center justify-between"
							>
								<div className="flex items-center gap-3">
									<div className="theme-section-soft p-2 rounded-xl transition-colors">
										<Users className="theme-kicker w-4 h-4 group-hover:text-[var(--color-amber-500)]" />
									</div>
									<div>
										<h4 className="theme-title font-bold text-sm">{role.name}</h4>
										<div className="flex flex-wrap items-center gap-2 mt-1">
											<span className="theme-kicker text-[10px] font-mono">ID: {role.id}</span>
											<span className="w-1 h-1 bg-[var(--color-gray-200)] rounded-full" />
											<span className="theme-tag-amber text-[10px] font-medium px-1.5 py-0.5 rounded-md">
												{role.world_name || '未绑定世界'}
											</span>
											{role.gpt_model_name && (
												<span className="theme-tag-blue text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-1">
													<span className="w-1 h-1 bg-[var(--color-blue-400)] rounded-full" />
													GPT: {role.gpt_model_name}
												</span>
											)}
											{role.sov_model_name && (
												<span className="theme-tag-violet text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-1">
													<span className="w-1 h-1 bg-[rgba(114,80,184,0.75)] rounded-full" />
													SOV: {role.sov_model_name}
												</span>
											)}
											{role.language && (
												<span className="theme-tag-success text-[10px] font-medium px-1.5 py-0.5 rounded-md">
													{role.language.toUpperCase()}
												</span>
											)}
										</div>
									</div>
								</div>
								<button
									type="button"
									onClick={() => onDeleteRole(role)}
									className="theme-button-danger-ghost p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
					{(!selectedVersion || roles.filter(r => r.version === selectedVersion).length === 0) && (
						<div className="theme-empty-state col-span-full py-16 flex flex-col items-center justify-center rounded-3xl border border-dashed">
							<Users className="theme-kicker w-10 h-10 mb-3" />
							<p className="theme-title text-sm font-bold">该基础版本下暂无角色</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default VersionsPage;
