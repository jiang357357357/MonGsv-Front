import React from 'react';
import { RoleWorkspaceOption } from '../../types';

interface TextForm {
  list_file: string;
  input_wav_dir: string;
  experiment_name: string;
  output_dir: string;
}

interface AudioForm extends TextForm {
  version: string;
}

interface SemanticForm {
  list_file: string;
  cnhubert_dir: string;
  experiment_name: string;
  output_dir: string;
  version: string;
}

interface FormattingTestPageProps {
  selectedRoleName: string;
  workspaceOptions: RoleWorkspaceOption[];
  textForm: TextForm;
  audioForm: AudioForm;
  semanticForm: SemanticForm;
  formattingOutputDir: string;
  formattingCnhubertDir: string;
  runningId: string | null;
  versionOptions: readonly string[];
  renderField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  renderSelectField: (label: string, value: string, options: readonly string[], onChange: (value: string) => void) => React.ReactNode;
  renderPathField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  onRoleChange: (value: string) => void;
  onSharedFieldChange: (field: 'list_file' | 'input_wav_dir' | 'experiment_name' | 'output_dir' | 'version', value: string) => void;
  onStartText: () => void;
  onStartAudio: () => void;
  onStartSemantic: () => void;
}

const FormattingTestPage: React.FC<FormattingTestPageProps> = ({
  selectedRoleName,
  workspaceOptions,
  textForm,
  audioForm,
  semanticForm,
  formattingOutputDir,
  formattingCnhubertDir,
  runningId,
  versionOptions,
  renderField,
  renderSelectField,
  renderPathField,
  onRoleChange,
  onSharedFieldChange,
  onStartText,
  onStartAudio,
  onStartSemantic,
}) => {
  const roleNames = workspaceOptions.map((item) => item.role_name);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="theme-title text-2xl font-black">训练集格式化</h3>
        <p className="theme-subtitle mt-2 text-sm">
          这里把官方 `1A / 1B / 1C` 放在同一个子页面里，方便连续滚动查看和逐步执行。三步应共用同一个实验输出目录。
        </p>
      </div>

      <div className="theme-card-soft rounded-2xl border p-5 space-y-5">
        <div>
          <h4 className="theme-title text-xl font-black">共享输入</h4>
          <p className="theme-subtitle mt-2 text-sm">
            优先按角色目录选择，自动带出 `标注文件 / 切分目录 / 输出目录 / 实验名`。`1C` 的 `CNHubert` 特征目录会按输出目录自动推导为 `4-cnhubert`。
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderSelectField('角色目录', selectedRoleName, roleNames, onRoleChange)}
          {renderPathField('标注文件', textForm.list_file, (value) => onSharedFieldChange('list_file', value))}
          {renderPathField('切分音频目录', textForm.input_wav_dir, (value) => onSharedFieldChange('input_wav_dir', value))}
          {renderField('实验名', textForm.experiment_name, (value) => onSharedFieldChange('experiment_name', value))}
          {renderPathField('输出目录', formattingOutputDir, (value) => onSharedFieldChange('output_dir', value))}
          {renderSelectField('版本', audioForm.version, versionOptions, (value) => onSharedFieldChange('version', value))}
        </div>
        <div className="rounded-2xl bg-[var(--color-gray-50)] px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
          <div>自动推导的 1C 特征目录: {formattingCnhubertDir}</div>
        </div>
      </div>

      <div className="theme-card-soft rounded-2xl border p-5 space-y-5">
        <div>
          <h4 className="theme-title text-xl font-black">1A 文本分词与特征提取</h4>
          <p className="theme-subtitle mt-2 text-sm">
            使用上面的共享输入，生成 `2-name2text.txt`，并在需要时写出 `3-bert`。
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-gray-50)] px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
          <div>输出目录: {textForm.output_dir}</div>
          <div className="mt-1">产物: `2-name2text.txt` / `3-bert`</div>
        </div>
        <button
          type="button"
          onClick={onStartText}
          className="theme-nav-item theme-nav-item-active rounded-xl border px-5 py-3 text-sm font-black"
        >
          {runningId === 'text' ? '1A 执行中' : '开始 1A'}
        </button>
      </div>

      <div className="theme-card-soft rounded-2xl border p-5 space-y-5">
        <div>
          <h4 className="theme-title text-xl font-black">1B 语音自监督特征提取</h4>
          <p className="theme-subtitle mt-2 text-sm">
            生成 `4-cnhubert` 和 `5-wav32k`。输出目录应与 `1A` 保持一致。
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-gray-50)] px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
          <div>输出目录: {audioForm.output_dir}</div>
          <div className="mt-1">产物: `4-cnhubert` / `5-wav32k` / `7-sv_cn`</div>
        </div>
        <button
          type="button"
          onClick={onStartAudio}
          className="theme-nav-item theme-nav-item-active rounded-xl border px-5 py-3 text-sm font-black"
        >
          {runningId === 'audio' ? '1B 执行中' : '开始 1B'}
        </button>
      </div>

      <div className="theme-card-soft rounded-2xl border p-5 space-y-5">
        <div>
          <h4 className="theme-title text-xl font-black">1C 语义 Token 提取</h4>
          <p className="theme-subtitle mt-2 text-sm">
            读取 `4-cnhubert` 特征并生成 `6-name2semantic.tsv`。输出目录应与 `1A`、`1B` 保持一致。
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-gray-50)] px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
          <div>CNHubert 特征目录: {semanticForm.cnhubert_dir}</div>
          <div className="mt-1">输出目录: {semanticForm.output_dir}</div>
          <div className="mt-1">来源: 由共享输出目录自动推导为 `输出目录/4-cnhubert`</div>
          <div className="mt-1">产物: `6-name2semantic.tsv`</div>
        </div>
        <button
          type="button"
          onClick={onStartSemantic}
          className="theme-nav-item theme-nav-item-active rounded-xl border px-5 py-3 text-sm font-black"
        >
          {runningId === 'semantic' ? '1C 执行中' : '开始 1C'}
        </button>
      </div>
    </div>
  );
};

export default FormattingTestPage;
