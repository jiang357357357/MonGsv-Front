import React from 'react';
import { RoleWorkspaceOption } from '../../types';

interface TrainingForm {
  project_name: string;
  input_audio_dir: string;
  output_dir: string;
  language: string;
  version: string;
  train_gpt: string;
  train_sovits: string;
  gpt_batch_size: string;
  gpt_total_epoch: string;
  sovits_batch_size: string;
  sovits_total_epoch: string;
  training_order: string;
}

interface TrainingWorkflowTestPageProps {
  form: TrainingForm;
  selectedRoleName: string;
  workspaceOptions: RoleWorkspaceOption[];
  runningId: string | null;
  languageOptions: readonly string[];
  versionOptions: readonly string[];
  booleanOptions: readonly string[];
  trainingOrderOptions: readonly string[];
  renderField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  renderSelectField: (label: string, value: string, options: readonly string[], onChange: (value: string) => void) => React.ReactNode;
  renderPathField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  onRoleChange: (value: string) => void;
  onProjectNameChange: (value: string) => void;
  onInputDirChange: (value: string) => void;
  onOutputDirChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onTrainingOrderChange: (value: string) => void;
  onTrainGptChange: (value: string) => void;
  onTrainSovitsChange: (value: string) => void;
  onGptBatchChange: (value: string) => void;
  onGptEpochChange: (value: string) => void;
  onSovitsBatchChange: (value: string) => void;
  onSovitsEpochChange: (value: string) => void;
  onStart: () => void;
}

const TrainingWorkflowTestPage: React.FC<TrainingWorkflowTestPageProps> = ({
  form,
  selectedRoleName,
  workspaceOptions,
  runningId,
  languageOptions,
  versionOptions,
  booleanOptions,
  trainingOrderOptions,
  renderField,
  renderSelectField,
  renderPathField,
  onRoleChange,
  onProjectNameChange,
  onInputDirChange,
  onOutputDirChange,
  onLanguageChange,
  onVersionChange,
  onTrainingOrderChange,
  onTrainGptChange,
  onTrainSovitsChange,
  onGptBatchChange,
  onGptEpochChange,
  onSovitsBatchChange,
  onSovitsEpochChange,
  onStart,
}) => {
  const roleNames = workspaceOptions.map((item) => item.role_name);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="theme-title text-2xl font-black">训练引导测试</h3>
        <p className="theme-subtitle mt-2 text-sm">
          这条功能是“完整预处理完成后直接拉起训练”。它适合测整链路，不适合替代单步排错。
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {renderSelectField('角色目录', selectedRoleName, roleNames, onRoleChange)}
        {renderSelectField('语言', form.language, languageOptions, onLanguageChange)}
        {renderSelectField('版本', form.version, versionOptions, onVersionChange)}
        {renderSelectField('训练顺序', form.training_order, trainingOrderOptions, onTrainingOrderChange)}
        {renderSelectField('是否训练 GPT', form.train_gpt, booleanOptions, onTrainGptChange)}
        {renderSelectField('是否训练 SoVITS', form.train_sovits, booleanOptions, onTrainSovitsChange)}
        {renderField('GPT 批大小', form.gpt_batch_size, onGptBatchChange)}
        {renderField('GPT 轮数', form.gpt_total_epoch, onGptEpochChange)}
        {renderField('SoVITS 批大小', form.sovits_batch_size, onSovitsBatchChange)}
        {renderField('SoVITS 轮数', form.sovits_total_epoch, onSovitsEpochChange)}
      </div>
      <div className="theme-section-soft rounded-xl border px-4 py-3 font-mono text-xs leading-6 text-[var(--color-text-secondary)]">
        <div>项目名: {form.project_name}</div>
        <div className="mt-1">输入音频目录: {form.input_audio_dir}</div>
        <div className="mt-1">输出根目录: {form.output_dir}</div>
        <div className="mt-1">最终角色目录: {form.output_dir}/{form.project_name}</div>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="theme-nav-item theme-nav-item-active rounded-xl border px-5 py-3 text-sm font-black"
      >
        {runningId === 'training' ? '引导中' : '开始训练引导'}
      </button>
    </div>
  );
};

export default TrainingWorkflowTestPage;
