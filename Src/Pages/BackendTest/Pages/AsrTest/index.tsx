import React from 'react';
import { RoleWorkspaceOption } from '../../types';

interface AsrForm {
  audio_dir: string;
  output_file: string;
  language: string;
}

interface AsrTestPageProps {
  form: AsrForm;
  selectedRoleName: string;
  workspaceOptions: RoleWorkspaceOption[];
  runningId: string | null;
  derivedListFile: string;
  languageOptions: readonly string[];
  renderSelectField: (label: string, value: string, options: readonly string[], onChange: (value: string) => void) => React.ReactNode;
  renderPathField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  onRoleChange: (value: string) => void;
  onAudioDirChange: (value: string) => void;
  onOutputDirChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onStart: () => void;
}

const AsrTestPage: React.FC<AsrTestPageProps> = ({
  form,
  selectedRoleName,
  workspaceOptions,
  runningId,
  derivedListFile,
  languageOptions,
  renderSelectField,
  renderPathField,
  onRoleChange,
  onAudioDirChange,
  onOutputDirChange,
  onLanguageChange,
  onStart,
}) => {
  const roleNames = workspaceOptions.map((item) => item.role_name);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="theme-title text-2xl font-black">语音标注测试</h3>
        <p className="theme-subtitle mt-2 text-sm">
          这里调用 ASR，把角色切分目录转成标注结果。优先按角色目录来选，自动带出输入和输出路径。
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {renderSelectField('角色目录', selectedRoleName, roleNames, onRoleChange)}
        {renderPathField('音频目录', form.audio_dir, onAudioDirChange)}
        {renderPathField('输出目录', form.output_file, onOutputDirChange, '例如 Data/Output/asr_test')}
        {renderSelectField('语言', form.language, languageOptions, onLanguageChange)}
      </div>
      <div className="rounded-2xl bg-[var(--color-gray-50)] px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
        <div>自动推导的标注文件: {derivedListFile}</div>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="theme-nav-item theme-nav-item-active rounded-xl border px-5 py-3 text-sm font-black"
      >
        {runningId === 'asr' ? '标注中' : '开始标注测试'}
      </button>
    </div>
  );
};

export default AsrTestPage;
