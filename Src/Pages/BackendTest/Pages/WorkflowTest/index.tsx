import React from 'react';
import { RoleWorkspaceOption } from '../../types';

interface WorkflowForm {
  project_name: string;
  input_audio_dir: string;
  output_dir: string;
  language: string;
  version: string;
  start_training: string;
}

interface WorkflowTestPageProps {
  form: WorkflowForm;
  selectedRoleName: string;
  workspaceOptions: RoleWorkspaceOption[];
  runningId: string | null;
  languageOptions: readonly string[];
  versionOptions: readonly string[];
  booleanOptions: readonly string[];
  renderField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  renderSelectField: (label: string, value: string, options: readonly string[], onChange: (value: string) => void) => React.ReactNode;
  renderPathField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  onRoleChange: (value: string) => void;
  onProjectNameChange: (value: string) => void;
  onInputDirChange: (value: string) => void;
  onOutputDirChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onStartTrainingChange: (value: string) => void;
  onStart: () => void;
}

const WorkflowTestPage: React.FC<WorkflowTestPageProps> = ({
  form,
  selectedRoleName,
  workspaceOptions,
  runningId,
  languageOptions,
  versionOptions,
  booleanOptions,
  renderField,
  renderSelectField,
  renderPathField,
  onRoleChange,
  onProjectNameChange,
  onInputDirChange,
  onOutputDirChange,
  onLanguageChange,
  onVersionChange,
  onStartTrainingChange,
  onStart,
}) => {
  const roleNames = workspaceOptions.map((item) => item.role_name);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="theme-title text-2xl font-black">完整预处理测试</h3>
        <p className="theme-subtitle mt-2 text-sm">
          一次走完切分、标注、文本处理、音频特征、语义编码，不直接进入训练。这里对应 `/workflow/complete`。
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {renderSelectField('角色目录', selectedRoleName, roleNames, onRoleChange)}
        {renderSelectField('语言', form.language, languageOptions, onLanguageChange)}
        {renderSelectField('版本', form.version, versionOptions, onVersionChange)}
        {renderSelectField('是否直接训练', form.start_training, booleanOptions, onStartTrainingChange)}
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
        {runningId === 'workflow' ? '预处理中' : '开始完整预处理'}
      </button>
    </div>
  );
};

export default WorkflowTestPage;
