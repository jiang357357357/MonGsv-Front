import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RoleWorkspaceOption } from '../../types';
import { getApiBaseUrl } from '../../../../../System/Config';

interface InferenceTestPageProps {
  selectedRoleName: string;
  workspaceOptions: RoleWorkspaceOption[];
  gptModelPath: string;
  sovitsModelPath: string;
  refAudioPath: string;
  promptText: string;
  promptLanguage: string;
  text: string;
  textLanguage: string;
  howToCut: string;
  topK: string;
  topP: string;
  temperature: string;
  refAudioFile: File | null;
  runningId: string | null;
  languageOptions: readonly string[];
  renderField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  renderPathField: (label: string, value: string, onChange: (value: string) => void, placeholder?: string) => React.ReactNode;
  renderSelectField: (label: string, value: string, options: readonly string[], onChange: (value: string) => void) => React.ReactNode;
  onRoleChange: (value: string) => void;
  onGptModelChange: (value: string) => void;
  onSovitsModelChange: (value: string) => void;
  onRefAudioPathChange: (value: string) => void;
  onPromptTextChange: (value: string) => void;
  onPromptLanguageChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onTextLanguageChange: (value: string) => void;
  onHowToCutChange: (value: string) => void;
  onTopKChange: (value: string) => void;
  onTopPChange: (value: string) => void;
  onTemperatureChange: (value: string) => void;
  onRefAudioSelected: (files: FileList | null) => void;
  onClearRefAudio: () => void;
  onPromptTextAsr: () => void;
  onLoadModels: () => void;
  onStartInference: () => void;
}

const basenameFromPath = (value: string): string => {
  const normalized = value.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : value;
};

const InferenceTestPage: React.FC<InferenceTestPageProps> = ({
  selectedRoleName,
  workspaceOptions,
  gptModelPath,
  sovitsModelPath,
  refAudioPath,
  promptText,
  promptLanguage,
  text,
  textLanguage,
  howToCut,
  topK,
  topP,
  temperature,
  refAudioFile,
  runningId,
  languageOptions,
  renderField,
  renderPathField,
  renderSelectField,
  onRoleChange,
  onGptModelChange,
  onSovitsModelChange,
  onRefAudioPathChange,
  onPromptTextChange,
  onPromptLanguageChange,
  onTextChange,
  onTextLanguageChange,
  onHowToCutChange,
  onTopKChange,
  onTopPChange,
  onTemperatureChange,
  onRefAudioSelected,
  onClearRefAudio,
  onPromptTextAsr,
  onLoadModels,
  onStartInference,
}) => {
  const roleNames = workspaceOptions.map((item) => item.role_name);
  const selectedWorkspace = workspaceOptions.find((item) => item.role_name === selectedRoleName) || null;
  const gptOptions = Array.isArray(selectedWorkspace?.gpt_models) ? selectedWorkspace.gpt_models : [];
  const sovitsOptions = Array.isArray(selectedWorkspace?.sovits_models) ? selectedWorkspace.sovits_models : [];
  const promptOptions = Array.isArray(selectedWorkspace?.prompt_files) ? selectedWorkspace.prompt_files : [];
  const cutMethodOptions = ['不切', '凑四句一切', '凑50字一切', '按中文句号。切', '按英文句号.切', '按标点符号切'] as const;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadedAudioUrl = useMemo(() => {
    if (!refAudioFile) {
      return '';
    }
    return URL.createObjectURL(refAudioFile);
  }, [refAudioFile]);
  const roleAudioUrl = useMemo(() => {
    if (!refAudioPath) {
      return '';
    }
    const baseUrl = getApiBaseUrl().replace(/\/+$/g, '');
    return `${baseUrl}/inference/ref-audio?path=${encodeURIComponent(refAudioPath)}`;
  }, [refAudioPath]);

  useEffect(() => {
    return () => {
      if (uploadedAudioUrl) {
        URL.revokeObjectURL(uploadedAudioUrl);
      }
    };
  }, [uploadedAudioUrl]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="theme-title text-2xl font-black">推理测试</h3>
        <p className="theme-subtitle mt-2 text-sm">
          参考官方推理界面，先加载 GPT 和 SoVITS 模型，再提交参考音频、参考文本和目标文本测试 `/inference/tts`。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {renderSelectField('角色目录', selectedRoleName, roleNames, onRoleChange)}
        {renderSelectField('参考语种', promptLanguage, languageOptions, onPromptLanguageChange)}
        {renderSelectField('目标语种', textLanguage, languageOptions, onTextLanguageChange)}
        {renderSelectField('切分方式', howToCut, cutMethodOptions, onHowToCutChange)}
        {renderField('Top-K', topK, onTopKChange)}
        {renderField('Top-P', topP, onTopPChange)}
        {renderField('Temperature', temperature, onTemperatureChange)}
      </div>

      <div className="theme-card-soft rounded-2xl border p-5">
        <div className="mb-4 text-sm font-black">模型与参考音频</div>
        <div className="grid grid-cols-1 gap-4">
          {renderSelectField('GPT 模型', gptModelPath, gptOptions, onGptModelChange)}
          {renderSelectField('SoVITS 模型', sovitsModelPath, sovitsOptions, onSovitsModelChange)}
          {renderSelectField('角色提示音频', refAudioPath, promptOptions, onRefAudioPathChange)}
        </div>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            onRefAudioSelected(event.dataTransfer.files);
          }}
          className={[
            'theme-section-soft mt-4 rounded-xl border border-dashed p-4 transition-all',
            isDragOver ? 'border-[var(--color-amber-400)] shadow-[var(--shadow-amber)]' : '',
          ].join(' ')}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black">上传参考音频</div>
              <div className="theme-subtitle mt-1 text-xs">
                可直接拖入本地音频。若上传文件，优先使用上传文件；否则使用上面的角色提示音频路径。
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="theme-button-secondary rounded-xl px-4 py-2 text-sm font-bold"
            >
              选择参考音频
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg,.aac"
            className="hidden"
            onChange={(event) => onRefAudioSelected(event.target.files)}
          />
          <div className="mt-4">
            {refAudioFile ? (
              <div className="space-y-3">
                <div className="theme-input flex items-center justify-between rounded-xl px-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{refAudioFile.name}</div>
                    <div className="theme-subtitle text-xs">{(refAudioFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button
                    type="button"
                    onClick={onClearRefAudio}
                    className="theme-button-danger-ghost rounded-lg px-3 py-2 text-xs font-bold"
                  >
                    清除
                  </button>
                </div>
                {uploadedAudioUrl ? <audio controls className="w-full" src={uploadedAudioUrl} /> : null}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="theme-subtitle text-sm">
                  {refAudioPath ? `当前将使用角色提示音频: ${basenameFromPath(refAudioPath)}` : '还没有设置参考音频'}
                </div>
                {roleAudioUrl ? <audio controls className="w-full" src={roleAudioUrl} /> : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="theme-card-soft rounded-2xl border p-5">
        <div className="mb-4 text-sm font-black">推理文本</div>
        <div className="grid grid-cols-1 gap-4">
          <label className="block">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="block text-xs font-black text-[var(--color-text-secondary)]">参考音频文本</span>
              <button
                type="button"
                onClick={onPromptTextAsr}
                className="theme-button-secondary rounded-lg px-3 py-2 text-xs font-bold"
              >
                {runningId === 'inference-asr' ? '识别中' : '用 ASR 识别'}
              </button>
            </div>
            <textarea
              value={promptText}
              onChange={(event) => onPromptTextChange(event.target.value)}
              rows={4}
              className="theme-input w-full rounded-xl px-3 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-black text-[var(--color-text-secondary)]">目标文本</span>
            <textarea
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              rows={8}
              className="theme-input w-full rounded-xl px-3 py-3 text-sm"
            />
          </label>
        </div>
      </div>

      <div className="theme-section-soft rounded-xl border px-4 py-3 text-xs leading-6 text-[var(--color-text-secondary)]">
        <div className="font-mono">GPT: {gptModelPath || '未选择'}</div>
        <div className="mt-1 font-mono">SoVITS: {sovitsModelPath || '未选择'}</div>
        <div className="mt-1 font-mono">参考音频: {refAudioFile ? refAudioFile.name : (refAudioPath || '未设置')}</div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onLoadModels}
          className="theme-nav-item rounded-xl border px-5 py-3 text-sm font-black"
        >
          {runningId === 'inference-load-models' ? '模型加载中' : '先加载推理模型'}
        </button>
        <button
          type="button"
          onClick={onStartInference}
          className="theme-nav-item theme-nav-item-active rounded-xl border px-5 py-3 text-sm font-black"
        >
          {runningId === 'inference-tts' ? '推理中' : '执行推理'}
        </button>
      </div>
    </div>
  );
};

export default InferenceTestPage;
