import React from 'react';
import { RoleWorkspaceOption } from '../../types';

interface SliceForm {
  input_path: string;
  output_dir: string;
  threshold: string;
  min_length: string;
}

interface SliceTestPageProps {
  form: SliceForm;
  selectedRoleName: string;
  selectedRawFile: string;
  workspaceOptions: RoleWorkspaceOption[];
  runningId: string | null;
  renderField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  renderSelectField: (label: string, value: string, options: readonly string[], onChange: (value: string) => void) => React.ReactNode;
  renderPathField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  onRoleChange: (value: string) => void;
  onRawFileChange: (value: string) => void;
  onInputPathChange: (value: string) => void;
  onOutputDirChange: (value: string) => void;
  onThresholdChange: (value: string) => void;
  onMinLengthChange: (value: string) => void;
  onStart: () => void;
}

const SliceTestPage: React.FC<SliceTestPageProps> = ({
  form,
  selectedRoleName,
  selectedRawFile,
  workspaceOptions,
  runningId,
  renderField,
  renderSelectField,
  renderPathField,
  onRoleChange,
  onRawFileChange,
  onInputPathChange,
  onOutputDirChange,
  onThresholdChange,
  onMinLengthChange,
  onStart,
}) => {
  const selectedWorkspace = workspaceOptions.find((item) => item.role_name === selectedRoleName) || null;
  const roleNames = workspaceOptions.map((item) => item.role_name);
  const rawFiles = selectedWorkspace?.raw_files || [];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="theme-title text-2xl font-black">音频切分测试</h3>
        <p className="theme-subtitle mt-2 text-sm">
          优先按角色目录来选素材，自动带出原始音频和切分输出目录。
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {renderSelectField('角色目录', selectedRoleName, roleNames, onRoleChange)}
        {renderSelectField('原始音频', selectedRawFile, rawFiles, onRawFileChange)}
        {renderPathField('输入音频路径', form.input_path, onInputPathChange)}
        {renderPathField('输出目录', form.output_dir, onOutputDirChange)}
        {renderField('阈值', form.threshold, onThresholdChange)}
        {renderField('最小长度', form.min_length, onMinLengthChange)}
      </div>
      <button
        type="button"
        onClick={onStart}
        className="theme-nav-item theme-nav-item-active rounded-xl border px-5 py-3 text-sm font-black"
      >
        {runningId === 'slice' ? '切分中' : '开始切分测试'}
      </button>
    </div>
  );
};

export default SliceTestPage;
