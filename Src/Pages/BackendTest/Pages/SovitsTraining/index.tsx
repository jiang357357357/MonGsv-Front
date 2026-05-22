import React from 'react';
import { RoleWorkspaceOption } from '../../types';

const trimTrailingSeparators = (value: string): string => value.replace(/[\\/]+$/, '');

const joinPath = (base: string, leaf: string): string => {
  const trimmedBase = trimTrailingSeparators(base);
  if (!trimmedBase) {
    return leaf;
  }
  const separator = trimmedBase.includes('\\') ? '\\' : '/';
  const normalizedLeaf = leaf.replace(/[\\/]+/g, separator).replace(/^[\\/]+/, '');
  return `${trimmedBase}${separator}${normalizedLeaf}`;
};

interface SovitsTrainingPageProps {
  selectedRoleName: string;
  workspaceOptions: RoleWorkspaceOption[];
  projectName: string;
  outputDir: string;
  version: string;
  sovitsBatchSize: string;
  sovitsEpoch: string;
  runningId: string | null;
  versionOptions: readonly string[];
  renderField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  renderPathField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  renderSelectField: (label: string, value: string, options: readonly string[], onChange: (value: string) => void) => React.ReactNode;
  onRoleChange: (value: string) => void;
  onProjectNameChange: (value: string) => void;
  onOutputDirChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onBatchSizeChange: (value: string) => void;
  onEpochChange: (value: string) => void;
  onStart: () => void;
}

const SovitsTrainingPage: React.FC<SovitsTrainingPageProps> = ({
  selectedRoleName,
  workspaceOptions,
  projectName,
  outputDir,
  version,
  sovitsBatchSize,
  sovitsEpoch,
  runningId,
  versionOptions,
  renderField,
  renderPathField,
  renderSelectField,
  onRoleChange,
  onProjectNameChange,
  onOutputDirChange,
  onVersionChange,
  onBatchSizeChange,
  onEpochChange,
  onStart,
}) => {
  const roleNames = workspaceOptions.map((item) => item.role_name);
  const trainingDir = joinPath(outputDir, projectName);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="theme-title text-2xl font-black">SoVITS 训练测试</h3>
        <p className="theme-subtitle mt-2 text-sm">
          这里只启动 SoVITS 训练，不再执行预处理。要求角色目录下已经有 `4-cnhubert`、`5-wav32k`、`6-name2semantic.tsv` 等训练输入。
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {renderSelectField('角色目录', selectedRoleName, roleNames, onRoleChange)}
        {renderSelectField('版本', version, versionOptions, onVersionChange)}
        {renderField('SoVITS 批大小', sovitsBatchSize, onBatchSizeChange)}
        {renderField('SoVITS 轮数', sovitsEpoch, onEpochChange)}
      </div>

      <div className="theme-section-soft rounded-xl border px-4 py-3 text-xs leading-6 text-[var(--color-text-secondary)]">
        <div className="font-mono">项目名: {projectName}</div>
        <div className="mt-1 font-mono">输出根目录: {outputDir}</div>
        <div className="mt-1 font-mono">最终训练目录: {trainingDir}</div>
        <div className="mt-3">
          实际提交时会把“输出根目录 + 项目名”组合成训练目录，后端会按这个目录查找 SoVITS 训练所需文件。
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="theme-nav-item rounded-xl border px-5 py-3 text-sm font-black"
      >
        {runningId === 'training-sovits' ? 'SoVITS 启动中' : '仅启动 SoVITS'}
      </button>
    </div>
  );
};

export default SovitsTrainingPage;
