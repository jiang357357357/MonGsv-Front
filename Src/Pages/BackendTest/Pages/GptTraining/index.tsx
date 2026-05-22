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

interface GptTrainingPageProps {
  selectedRoleName: string;
  workspaceOptions: RoleWorkspaceOption[];
  projectName: string;
  outputDir: string;
  version: string;
  gptBatchSize: string;
  gptEpoch: string;
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

const GptTrainingPage: React.FC<GptTrainingPageProps> = ({
  selectedRoleName,
  workspaceOptions,
  projectName,
  outputDir,
  version,
  gptBatchSize,
  gptEpoch,
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
  const datasetDir = joinPath(trainingDir, 'dataset');

  return (
    <div className="space-y-5">
      <div>
        <h3 className="theme-title text-2xl font-black">GPT 训练测试</h3>
        <p className="theme-subtitle mt-2 text-sm">
          这里只启动 GPT 训练，不再执行切分、标注和 1A/1B/1C。要求角色目录下已经存在完整预处理产物。
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {renderSelectField('角色目录', selectedRoleName, roleNames, onRoleChange)}
        {renderSelectField('版本', version, versionOptions, onVersionChange)}
        {renderField('GPT 批大小', gptBatchSize, onBatchSizeChange)}
        {renderField('GPT 轮数', gptEpoch, onEpochChange)}
      </div>

      <div className="theme-section-soft rounded-xl border px-4 py-3 text-xs leading-6 text-[var(--color-text-secondary)]">
        <div className="font-mono">项目名: {projectName}</div>
        <div className="mt-1 font-mono">训练版本: {version}</div>
        <div className="mt-1 font-mono">输出根目录: {outputDir}</div>
        <div className="mt-1 font-mono">最终训练目录: {trainingDir}</div>
        <div className="mt-1 font-mono">训练数据目录: {datasetDir}</div>
        <div className="mt-3">
          按官方逻辑，`v1` 使用 `s1longer.yaml`，其他版本统一使用 `s1longer-v2.yaml`。后端会在 `dataset` 子目录里查找 `6-name2semantic.tsv` 和 `2-name2text.txt`。
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="theme-nav-item rounded-xl border px-5 py-3 text-sm font-black"
      >
        {runningId === 'training-gpt' ? 'GPT 启动中' : '仅启动 GPT'}
      </button>
    </div>
  );
};

export default GptTrainingPage;
