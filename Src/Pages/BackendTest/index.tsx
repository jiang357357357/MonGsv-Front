import React, { useEffect, useState } from 'react';
import {
  AudioWaveform,
  BrainCircuit,
  FileAudio2,
  FileText,
  FolderSearch2,
  TerminalSquare,
  Volume2,
  WandSparkles,
} from 'lucide-react';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import { AppView } from '../../types';
import { fetchRoleWorkspaces, runRouteTest } from './Services/backendTestApi';
import { HttpMethod, RequestContentType, RoleWorkspaceOption, RouteTestResult } from './types';
import GptTrainingPage from './Pages/GptTraining';
import SovitsTrainingPage from './Pages/SovitsTraining';
import SliceTestPage from './Pages/SliceTest';
import AsrTestPage from './Pages/AsrTest';
import FormattingTestPage from './Pages/FormattingTest';
import WorkflowTestPage from './Pages/WorkflowTest';
import TrainingWorkflowTestPage from './Pages/TrainingWorkflowTest';
import CustomRequestTestPage from './Pages/CustomRequestTest';
import InferenceTestPage from './Pages/InferenceTest';
import TestSidebar from './Components/TestSidebar';
import TestResultPanel from './Components/TestResultPanel';

type TestModuleId =
  | 'slice'
  | 'asr'
  | 'formatting'
  | 'workflow'
  | 'training'
  | 'training_gpt'
  | 'training_sovits'
  | 'inference'
  | 'custom';

interface TestModule {
  id: TestModuleId;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TEST_MODULES: TestModule[] = [
  {
    id: 'slice',
    title: '音频切分',
    subtitle: '测试 `/data-prep/audio-slice/process`',
    icon: AudioWaveform,
  },
  {
    id: 'asr',
    title: '语音标注',
    subtitle: '测试 `/data-prep/asr/recognize`',
    icon: FileAudio2,
  },
  {
    id: 'formatting',
    title: '训练集格式化',
    subtitle: '1A / 1B / 1C 顺序执行',
    icon: FileText,
  },
  {
    id: 'workflow',
    title: '完整预处理',
    subtitle: '测试 `/workflow/complete`',
    icon: FolderSearch2,
  },
  {
    id: 'training',
    title: '训练引导',
    subtitle: '测试 `/workflow/training/full`',
    icon: WandSparkles,
  },
  {
    id: 'training_sovits',
    title: 'SoVITS训练',
    subtitle: '测试 `/training/sovits/start`',
    icon: BrainCircuit,
  },
  {
    id: 'training_gpt',
    title: 'GPT训练',
    subtitle: '测试 `/training/gpt/start`',
    icon: WandSparkles,
  },
  {
    id: 'inference',
    title: '推理测试',
    subtitle: '测试 `/inference/tts`',
    icon: Volume2,
  },
  {
    id: 'custom',
    title: '自定义调试',
    subtitle: '手工指定路径和负载',
    icon: TerminalSquare,
  },
];

const VERSION_OPTIONS = ['v1', 'v2', 'v4', 'v2Pro', 'v2ProPlus'] as const;
const LANGUAGE_OPTIONS = ['zh', 'yue', 'en', 'ja', 'ko', 'auto'] as const;
const BOOLEAN_OPTIONS = ['true', 'false'] as const;
const TRAINING_ORDER_OPTIONS = ['sovits_first', 'gpt_first'] as const;
const OPTION_LABELS: Record<string, string> = {
  zh: '中文',
  yue: '粤语',
  en: '英文',
  ja: '日文',
  ko: '韩文',
  auto: '自动识别',
};

const prettyJson = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const trimTrailingSeparators = (value: string): string => value.replace(/[\\\/]+$/, '');

const basenameFromPath = (value: string): string => {
  const normalized = trimTrailingSeparators(value).replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : '';
};

const dirnameFromPath = (value: string): string => {
  const trimmed = trimTrailingSeparators(value);
  if (!trimmed) {
    return '';
  }
  const normalized = trimmed.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  if (index <= 0) {
    return '';
  }
  const parent = normalized.slice(0, index);
  return trimmed.includes('\\') ? parent.replace(/\//g, '\\') : parent;
};

const joinPath = (base: string, leaf: string): string => {
  const trimmedBase = trimTrailingSeparators(base);
  if (!trimmedBase) {
    return leaf;
  }
  const separator = trimmedBase.includes('\\') ? '\\' : '/';
  const normalizedLeaf = leaf.replace(/[\\\/]+/g, separator).replace(/^[\\\/]+/, '');
  return `${trimmedBase}${separator}${normalizedLeaf}`;
};

const firstItem = (items?: string[]): string => (Array.isArray(items) && items.length > 0 ? items[0] : '');

const BackendTestPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<TestModuleId>('slice');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [result, setResult] = useState<RouteTestResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [workspaceOptions, setWorkspaceOptions] = useState<RoleWorkspaceOption[]>([]);
  const [isRefreshingWorkspaces, setIsRefreshingWorkspaces] = useState(false);
  const [selectedSliceRole, setSelectedSliceRole] = useState('');
  const [selectedSliceRawFile, setSelectedSliceRawFile] = useState('');
  const [selectedAsrRole, setSelectedAsrRole] = useState('');
  const [selectedFormattingRole, setSelectedFormattingRole] = useState('');
  const [selectedWorkflowRole, setSelectedWorkflowRole] = useState('');
  const [selectedTrainingRole, setSelectedTrainingRole] = useState('');
  const [selectedInferenceRole, setSelectedInferenceRole] = useState('');

  const [sliceForm, setSliceForm] = useState({
    input_path: 'Data/Input/demo_audio.wav',
    output_dir: 'Data/Output/slice_test',
    threshold: '-34.0',
    min_length: '4000',
  });
  const [asrForm, setAsrForm] = useState({
    audio_dir: 'Data/Output/slice_test',
    output_file: 'Data/Output/asr_test',
    language: 'zh',
  });
  const [textForm, setTextForm] = useState({
    list_file: 'Data/Output/asr_test/slice_test.list',
    input_wav_dir: 'Data/Output/slice_test',
    experiment_name: 'demo-project',
    output_dir: 'Data/Output/demo-project',
  });
  const [audioForm, setAudioForm] = useState({
    list_file: 'Data/Output/asr_test/slice_test.list',
    input_wav_dir: 'Data/Output/slice_test',
    experiment_name: 'demo-project',
    output_dir: 'Data/Output/demo-project',
    version: 'v2Pro',
  });
  const [semanticForm, setSemanticForm] = useState({
    list_file: 'Data/Output/asr_test/slice_test.list',
    cnhubert_dir: 'Data/Output/demo-project/4-cnhubert',
    experiment_name: 'demo-project',
    output_dir: 'Data/Output/demo-project',
    version: 'v2Pro',
  });
  const [workflowForm, setWorkflowForm] = useState({
    project_name: 'demo-project',
    input_audio_dir: 'Data/Input/demo_audio',
    output_dir: 'Data/Output',
    language: 'zh',
    version: 'v2Pro',
    start_training: 'false',
    train_gpt: 'true',
    train_sovits: 'true',
    gpt_batch_size: '8',
    gpt_total_epoch: '15',
    sovits_batch_size: '32',
    sovits_total_epoch: '8',
    training_order: 'sovits_first',
  });
  const [trainingForm, setTrainingForm] = useState({
    project_name: 'demo-project',
    input_audio_dir: 'Data/Input/demo_audio',
    output_dir: 'Data/Output',
    language: 'zh',
    version: 'v2Pro',
    train_gpt: 'true',
    train_sovits: 'true',
    gpt_batch_size: '8',
    gpt_total_epoch: '15',
    sovits_batch_size: '32',
    sovits_total_epoch: '8',
    training_order: 'sovits_first',
  });
  const [customMethod, setCustomMethod] = useState<HttpMethod>('GET');
  const [customContentType, setCustomContentType] = useState<RequestContentType>('json');
  const [customPath, setCustomPath] = useState('/health');
  const [customBody, setCustomBody] = useState('{}');
  const [inferenceRefAudioFile, setInferenceRefAudioFile] = useState<File | null>(null);
  const [inferenceForm, setInferenceForm] = useState({
    gpt_path: '',
    sovits_path: '',
    ref_audio_path: '',
    prompt_text: '',
    prompt_language: 'zh',
    text: '你好，这是推理测试。',
    text_language: 'zh',
    how_to_cut: '按标点符号切',
    top_k: '15',
    top_p: '1.0',
    temperature: '1.0',
  });

  const applyWorkspaceSelection = (workspace: RoleWorkspaceOption) => {
    const firstRawFile = workspace.raw_files[0] || '';
    const formattingOutputDir = joinPath(workspace.role_root, 'dataset');
    const formattingListFile = joinPath(
      joinPath(workspace.role_root, 'dataset/asr'),
      `${basenameFromPath(workspace.sliced_dir) || 'slice_output'}.list`
    );
    const roleParentDir = dirnameFromPath(workspace.role_root);
    const asrOutputDir = joinPath(workspace.role_root, 'dataset/asr');

    setSelectedSliceRole(workspace.role_name);
    setSelectedAsrRole(workspace.role_name);
    setSelectedFormattingRole(workspace.role_name);
    setSelectedWorkflowRole(workspace.role_name);
    setSelectedTrainingRole(workspace.role_name);
    setSelectedInferenceRole(workspace.role_name);
    setSelectedSliceRawFile(firstRawFile);
    if (firstRawFile) {
      setSliceForm((prev) => ({ ...prev, input_path: firstRawFile }));
    }
    setSliceForm((prev) => ({ ...prev, output_dir: workspace.sliced_dir }));
    setAsrForm((prev) => ({
      ...prev,
      audio_dir: workspace.sliced_dir,
      output_file: asrOutputDir,
    }));
    setTextForm((prev) => ({
      ...prev,
      list_file: formattingListFile,
      input_wav_dir: workspace.sliced_dir,
      experiment_name: workspace.role_name,
      output_dir: formattingOutputDir,
    }));
    setAudioForm((prev) => ({
      ...prev,
      list_file: formattingListFile,
      input_wav_dir: workspace.sliced_dir,
      experiment_name: workspace.role_name,
      output_dir: formattingOutputDir,
    }));
    setSemanticForm((prev) => ({
      ...prev,
      list_file: formattingListFile,
      experiment_name: workspace.role_name,
      output_dir: formattingOutputDir,
      cnhubert_dir: joinPath(workspace.role_root, 'dataset/4-cnhubert'),
    }));
    setWorkflowForm((prev) => ({
      ...prev,
      project_name: workspace.role_name,
      input_audio_dir: workspace.raw_dir,
      output_dir: roleParentDir,
    }));
    setTrainingForm((prev) => ({
      ...prev,
      project_name: workspace.role_name,
      input_audio_dir: workspace.raw_dir,
      output_dir: roleParentDir,
    }));
    setInferenceForm((prev) => ({
      ...prev,
      gpt_path: firstItem(workspace.gpt_models),
      sovits_path: firstItem(workspace.sovits_models),
      ref_audio_path: firstItem(workspace.prompt_files),
    }));
    syncFormattingFromAsr(workspace.sliced_dir, asrOutputDir);
  };

  const loadWorkspaces = async () => {
    setIsRefreshingWorkspaces(true);
    try {
      const workspaces = await fetchRoleWorkspaces();
      setWorkspaceOptions(workspaces);
      if (workspaces.length === 0) {
        return;
      }

      const preferredRoleName = [
        selectedTrainingRole,
        selectedWorkflowRole,
        selectedFormattingRole,
        selectedAsrRole,
        selectedSliceRole,
      ].find(Boolean);
      const workspace =
        workspaces.find((item) => item.role_name === preferredRoleName) || workspaces[0];
      applyWorkspaceSelection(workspace);
    } catch (error) {
      console.error('加载角色目录失败', error);
    } finally {
      setIsRefreshingWorkspaces(false);
    }
  };

  useEffect(() => {
    void loadWorkspaces();
  }, []);

  const formattingOutputDir = textForm.output_dir;
  const formattingCnhubertDir = joinPath(formattingOutputDir, '4-cnhubert');
  const derivedListFile = joinPath(asrForm.output_file, `${basenameFromPath(sliceForm.output_dir) || 'slice_output'}.list`);

  const syncFormattingFromAsr = (
    nextSliceOutputDir: string,
    nextAsrOutputDir: string
  ) => {
    const listFile = joinPath(nextAsrOutputDir, `${basenameFromPath(nextSliceOutputDir) || 'slice_output'}.list`);
    updateFormattingField('list_file', listFile);
    updateFormattingField('input_wav_dir', nextSliceOutputDir);
  };

  const handleSliceRoleChange = (roleName: string) => {
    setSelectedSliceRole(roleName);
    const workspace = workspaceOptions.find((item) => item.role_name === roleName) || null;
    if (!workspace) {
      return;
    }
    const nextRawFile = workspace.raw_files[0] || '';
    setSelectedSliceRawFile(nextRawFile);
    setSliceForm((prev) => ({
      ...prev,
      input_path: nextRawFile || prev.input_path,
      output_dir: workspace.sliced_dir,
    }));
    setAsrForm((prev) => ({ ...prev, audio_dir: workspace.sliced_dir }));
    syncFormattingFromAsr(workspace.sliced_dir, asrForm.output_file);
  };

  const handleSliceRawFileChange = (rawFile: string) => {
    setSelectedSliceRawFile(rawFile);
    setSliceForm((prev) => ({ ...prev, input_path: rawFile }));
  };

  const handleAsrRoleChange = (roleName: string) => {
    setSelectedAsrRole(roleName);
    const workspace = workspaceOptions.find((item) => item.role_name === roleName) || null;
    if (!workspace) {
      return;
    }
    const asrOutputDir = joinPath(workspace.role_root, 'dataset/asr');
    setAsrForm((prev) => ({
      ...prev,
      audio_dir: workspace.sliced_dir,
      output_file: asrOutputDir,
    }));
    syncFormattingFromAsr(workspace.sliced_dir, asrOutputDir);
  };

  const handleFormattingRoleChange = (roleName: string) => {
    setSelectedFormattingRole(roleName);
    const workspace = workspaceOptions.find((item) => item.role_name === roleName) || null;
    if (!workspace) {
      return;
    }
    const nextOutputDir = joinPath(workspace.role_root, 'dataset');
    const nextListFile = joinPath(joinPath(workspace.role_root, 'dataset/asr'), `${basenameFromPath(workspace.sliced_dir) || 'slice_output'}.list`);
    setTextForm((prev) => ({
      ...prev,
      list_file: nextListFile,
      input_wav_dir: workspace.sliced_dir,
      experiment_name: workspace.role_name,
      output_dir: nextOutputDir,
    }));
    setAudioForm((prev) => ({
      ...prev,
      list_file: nextListFile,
      input_wav_dir: workspace.sliced_dir,
      experiment_name: workspace.role_name,
      output_dir: nextOutputDir,
    }));
    setSemanticForm((prev) => ({
      ...prev,
      list_file: nextListFile,
      experiment_name: workspace.role_name,
      output_dir: nextOutputDir,
      cnhubert_dir: joinPath(workspace.role_root, 'dataset/4-cnhubert'),
    }));
  };

  const handleWorkflowRoleChange = (roleName: string) => {
    setSelectedWorkflowRole(roleName);
    const workspace = workspaceOptions.find((item) => item.role_name === roleName) || null;
    if (!workspace) {
      return;
    }
    setWorkflowForm((prev) => ({
      ...prev,
      project_name: workspace.role_name,
      input_audio_dir: workspace.raw_dir,
      output_dir: dirnameFromPath(workspace.role_root),
    }));
  };

  const handleTrainingRoleChange = (roleName: string) => {
    setSelectedTrainingRole(roleName);
    const workspace = workspaceOptions.find((item) => item.role_name === roleName) || null;
    if (!workspace) {
      return;
    }
    setTrainingForm((prev) => ({
      ...prev,
      project_name: workspace.role_name,
      input_audio_dir: workspace.raw_dir,
      output_dir: dirnameFromPath(workspace.role_root),
    }));
  };

  const handleInferenceRoleChange = (roleName: string) => {
    setSelectedInferenceRole(roleName);
    const workspace = workspaceOptions.find((item) => item.role_name === roleName) || null;
    if (!workspace) {
      return;
    }
    setInferenceForm((prev) => ({
      ...prev,
      gpt_path: firstItem(workspace.gpt_models),
      sovits_path: firstItem(workspace.sovits_models),
      ref_audio_path: firstItem(workspace.prompt_files),
    }));
  };

  const updateFormattingField = (
    field: 'list_file' | 'input_wav_dir' | 'experiment_name' | 'output_dir' | 'version',
    value: string
  ) => {
    if (field === 'version') {
      setAudioForm((prev) => ({ ...prev, version: value }));
      setSemanticForm((prev) => ({ ...prev, version: value }));
      return;
    }

    setTextForm((prev) => ({ ...prev, [field]: value }));
    setAudioForm((prev) => ({ ...prev, [field]: value }));

    if (field === 'output_dir') {
      setSemanticForm((prev) => ({
        ...prev,
        output_dir: value,
        cnhubert_dir: joinPath(value, '4-cnhubert'),
      }));
      return;
    }

    if (field === 'input_wav_dir' || field === 'list_file' || field === 'experiment_name') {
      setSemanticForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const executeRequest = async (
    runId: string,
    method: HttpMethod,
    path: string,
    contentType: RequestContentType,
    payload?: Record<string, unknown>
  ) => {
    setRunningId(runId);
    setErrorText(null);
    try {
      const response = await runRouteTest(method, path, method === 'POST'
        ? { contentType, bodyText: JSON.stringify(payload || {}, null, 2) }
        : undefined);
      setResult(response);
    } catch (error) {
      setResult(null);
      setErrorText(error instanceof Error ? error.message : '请求失败');
    } finally {
      setRunningId(null);
    }
  };

  const executeCustom = async () => {
    setRunningId('custom');
    setErrorText(null);
    try {
      const response = await runRouteTest(customMethod, customPath, customMethod === 'POST'
        ? { contentType: customContentType, bodyText: customBody }
        : undefined);
      setResult(response);
    } catch (error) {
      setResult(null);
      setErrorText(error instanceof Error ? error.message : '请求失败');
    } finally {
      setRunningId(null);
    }
  };

  const executeMultipart = async (
    runId: string,
    path: string,
    payload: Record<string, unknown>,
    files: File[],
    filesByField?: Record<string, File[]>
  ) => {
    setRunningId(runId);
    setErrorText(null);
    try {
      const response = await runRouteTest('POST', path, {
        contentType: 'multipart',
        bodyText: JSON.stringify(payload, null, 2),
        files,
        filesByField,
      });
      setResult(response);
    } catch (error) {
      setResult(null);
      setErrorText(error instanceof Error ? error.message : '请求失败');
    } finally {
      setRunningId(null);
    }
  };

  const executeInferencePromptAsr = async () => {
    if (!inferenceRefAudioFile && !inferenceForm.ref_audio_path) {
      setErrorText('请先选择角色提示音频，再执行 ASR 识别。');
      return;
    }

    const selectedWorkspace = workspaceOptions.find((item) => item.role_name === selectedInferenceRole) || null;
    const outputFile = selectedWorkspace
      ? joinPath(selectedWorkspace.role_root, 'infer/cache/asr_prompt_preview.list')
      : joinPath(dirnameFromPath(inferenceForm.ref_audio_path), 'asr_prompt_preview.list');

    setRunningId('inference-asr');
    setErrorText(null);
    try {
      const isUploadedAudio = Boolean(inferenceRefAudioFile);
      const response = await runRouteTest('POST', '/data-prep/asr/recognize', isUploadedAudio
        ? {
          contentType: 'multipart',
          bodyText: JSON.stringify({
            output_file: outputFile,
            language: inferenceForm.prompt_language,
          }, null, 2),
          filesByField: {
            audio_file: inferenceRefAudioFile ? [inferenceRefAudioFile] : [],
          },
        }
        : {
          contentType: 'form',
          bodyText: JSON.stringify({
            audio_dir: inferenceForm.ref_audio_path,
            output_file: outputFile,
            language: inferenceForm.prompt_language,
          }, null, 2),
        });
      setResult(response);

      if (response.ok && typeof response.data === 'object' && response.data !== null) {
        const data = response.data as { recognition_results?: Array<{ text?: string }> };
        const recognizedText = data.recognition_results?.find((item) => typeof item.text === 'string' && item.text.trim())?.text?.trim() || '';
        if (recognizedText) {
          setInferenceForm((prev) => ({ ...prev, prompt_text: recognizedText }));
        } else {
          setErrorText('ASR 已执行，但没有识别出可用文本。');
        }
      }
    } catch (error) {
      setResult(null);
      setErrorText(error instanceof Error ? error.message : 'ASR 请求失败');
    } finally {
      setRunningId(null);
    }
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder?: string
  ) => (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[var(--color-text-secondary)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="theme-input w-full rounded-xl px-3 py-3 text-sm"
      />
    </label>
  );

  const renderSelectField = (
    label: string,
    value: string,
    options: readonly string[],
    onChange: (value: string) => void
  ) => (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[var(--color-text-secondary)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="theme-input w-full rounded-xl px-3 py-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {OPTION_LABELS[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );

  const renderPathField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder?: string
  ) => (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[var(--color-text-secondary)]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        title={value}
        rows={2}
        spellCheck={false}
        className="theme-input min-h-[5.5rem] w-full rounded-xl px-3 py-3 font-mono text-xs leading-5"
      />
    </label>
  );

  const renderFunctionalPanel = () => {
    if (activeModule === 'slice') {
      return (
        <SliceTestPage
          form={sliceForm}
          selectedRoleName={selectedSliceRole}
          selectedRawFile={selectedSliceRawFile}
          workspaceOptions={workspaceOptions}
          runningId={runningId}
          renderField={renderField}
          renderSelectField={renderSelectField}
          renderPathField={renderPathField}
          onRoleChange={handleSliceRoleChange}
          onRawFileChange={handleSliceRawFileChange}
          onInputPathChange={(value) => setSliceForm((prev) => ({ ...prev, input_path: value }))}
          onOutputDirChange={(value) => {
            setSliceForm((prev) => ({ ...prev, output_dir: value }));
            setAsrForm((prev) => ({ ...prev, audio_dir: value }));
            syncFormattingFromAsr(value, asrForm.output_file);
          }}
          onThresholdChange={(value) => setSliceForm((prev) => ({ ...prev, threshold: value }))}
          onMinLengthChange={(value) => setSliceForm((prev) => ({ ...prev, min_length: value }))}
          onStart={() => executeRequest('slice', 'POST', '/data-prep/audio-slice/process', 'form', sliceForm)}
        />
      );
    }

    if (activeModule === 'asr') {
      return (
        <AsrTestPage
          form={asrForm}
          selectedRoleName={selectedAsrRole}
          workspaceOptions={workspaceOptions}
          runningId={runningId}
          derivedListFile={derivedListFile}
          languageOptions={LANGUAGE_OPTIONS}
          renderSelectField={renderSelectField}
          renderPathField={renderPathField}
          onRoleChange={handleAsrRoleChange}
          onAudioDirChange={(value) => {
            setAsrForm((prev) => ({ ...prev, audio_dir: value }));
            updateFormattingField('input_wav_dir', value);
            updateFormattingField('list_file', joinPath(asrForm.output_file, `${basenameFromPath(value) || 'slice_output'}.list`));
          }}
          onOutputDirChange={(value) => {
            setAsrForm((prev) => ({ ...prev, output_file: value }));
            syncFormattingFromAsr(asrForm.audio_dir, value);
          }}
          onLanguageChange={(value) => setAsrForm((prev) => ({ ...prev, language: value }))}
          onStart={() => executeRequest('asr', 'POST', '/data-prep/asr/recognize', 'form', asrForm)}
        />
      );
    }

    if (activeModule === 'formatting') {
      return (
        <FormattingTestPage
          selectedRoleName={selectedFormattingRole}
          workspaceOptions={workspaceOptions}
          textForm={textForm}
          audioForm={audioForm}
          semanticForm={semanticForm}
          formattingOutputDir={formattingOutputDir}
          formattingCnhubertDir={formattingCnhubertDir}
          runningId={runningId}
          versionOptions={VERSION_OPTIONS}
          renderField={renderField}
          renderSelectField={renderSelectField}
          renderPathField={renderPathField}
          onRoleChange={handleFormattingRoleChange}
          onSharedFieldChange={updateFormattingField}
          onStartText={() => executeRequest('text', 'POST', '/dataset/text/extract', 'form', textForm)}
          onStartAudio={() => executeRequest('audio', 'POST', '/dataset/audio/extract', 'form', audioForm)}
          onStartSemantic={() => executeRequest('semantic', 'POST', '/dataset/semantic/encode', 'form', semanticForm)}
        />
      );
    }

    if (activeModule === 'workflow') {
      return (
        <WorkflowTestPage
          form={workflowForm}
          selectedRoleName={selectedWorkflowRole}
          workspaceOptions={workspaceOptions}
          runningId={runningId}
          languageOptions={LANGUAGE_OPTIONS}
          versionOptions={VERSION_OPTIONS}
          booleanOptions={BOOLEAN_OPTIONS}
          renderField={renderField}
          renderSelectField={renderSelectField}
          renderPathField={renderPathField}
          onRoleChange={handleWorkflowRoleChange}
          onProjectNameChange={(value) => setWorkflowForm((prev) => ({ ...prev, project_name: value }))}
          onInputDirChange={(value) => setWorkflowForm((prev) => ({ ...prev, input_audio_dir: value }))}
          onOutputDirChange={(value) => setWorkflowForm((prev) => ({ ...prev, output_dir: value }))}
          onLanguageChange={(value) => setWorkflowForm((prev) => ({ ...prev, language: value }))}
          onVersionChange={(value) => setWorkflowForm((prev) => ({ ...prev, version: value }))}
          onStartTrainingChange={(value) => setWorkflowForm((prev) => ({ ...prev, start_training: value }))}
          onStart={() => executeRequest('workflow', 'POST', '/workflow/complete', 'form', workflowForm)}
        />
      );
    }

    if (activeModule === 'training') {
      return (
        <TrainingWorkflowTestPage
          form={trainingForm}
          selectedRoleName={selectedTrainingRole}
          workspaceOptions={workspaceOptions}
          runningId={runningId}
          languageOptions={LANGUAGE_OPTIONS}
          versionOptions={VERSION_OPTIONS}
          booleanOptions={BOOLEAN_OPTIONS}
          trainingOrderOptions={TRAINING_ORDER_OPTIONS}
          renderField={renderField}
          renderSelectField={renderSelectField}
          renderPathField={renderPathField}
          onRoleChange={handleTrainingRoleChange}
          onProjectNameChange={(value) => setTrainingForm((prev) => ({ ...prev, project_name: value }))}
          onInputDirChange={(value) => setTrainingForm((prev) => ({ ...prev, input_audio_dir: value }))}
          onOutputDirChange={(value) => setTrainingForm((prev) => ({ ...prev, output_dir: value }))}
          onLanguageChange={(value) => setTrainingForm((prev) => ({ ...prev, language: value }))}
          onVersionChange={(value) => setTrainingForm((prev) => ({ ...prev, version: value }))}
          onTrainingOrderChange={(value) => setTrainingForm((prev) => ({ ...prev, training_order: value }))}
          onTrainGptChange={(value) => setTrainingForm((prev) => ({ ...prev, train_gpt: value }))}
          onTrainSovitsChange={(value) => setTrainingForm((prev) => ({ ...prev, train_sovits: value }))}
          onGptBatchChange={(value) => setTrainingForm((prev) => ({ ...prev, gpt_batch_size: value }))}
          onGptEpochChange={(value) => setTrainingForm((prev) => ({ ...prev, gpt_total_epoch: value }))}
          onSovitsBatchChange={(value) => setTrainingForm((prev) => ({ ...prev, sovits_batch_size: value }))}
          onSovitsEpochChange={(value) => setTrainingForm((prev) => ({ ...prev, sovits_total_epoch: value }))}
          onStart={() => executeRequest('training', 'POST', '/workflow/training/full', 'form', trainingForm)}
        />
      );
    }

    if (activeModule === 'training_sovits') {
      return (
        <SovitsTrainingPage
          selectedRoleName={selectedTrainingRole}
          workspaceOptions={workspaceOptions}
          projectName={trainingForm.project_name}
          outputDir={trainingForm.output_dir}
          version={trainingForm.version}
          sovitsBatchSize={trainingForm.sovits_batch_size}
          sovitsEpoch={trainingForm.sovits_total_epoch}
          runningId={runningId}
          versionOptions={VERSION_OPTIONS}
          renderField={renderField}
          renderPathField={renderPathField}
          renderSelectField={renderSelectField}
          onRoleChange={handleTrainingRoleChange}
          onProjectNameChange={(value) => setTrainingForm((prev) => ({ ...prev, project_name: value }))}
          onOutputDirChange={(value) => setTrainingForm((prev) => ({ ...prev, output_dir: value }))}
          onVersionChange={(value) => setTrainingForm((prev) => ({ ...prev, version: value }))}
          onBatchSizeChange={(value) => setTrainingForm((prev) => ({ ...prev, sovits_batch_size: value }))}
          onEpochChange={(value) => setTrainingForm((prev) => ({ ...prev, sovits_total_epoch: value }))}
          onStart={() => executeRequest('training-sovits', 'POST', '/training/sovits/start', 'form', {
            exp_name: trainingForm.project_name,
            exp_root: trainingForm.output_dir,
            version: trainingForm.version,
            batch_size: trainingForm.sovits_batch_size,
            total_epoch: trainingForm.sovits_total_epoch,
          })}
        />
      );
    }

    if (activeModule === 'training_gpt') {
      return (
        <GptTrainingPage
          selectedRoleName={selectedTrainingRole}
          workspaceOptions={workspaceOptions}
          projectName={trainingForm.project_name}
          outputDir={trainingForm.output_dir}
          version={trainingForm.version}
          gptBatchSize={trainingForm.gpt_batch_size}
          gptEpoch={trainingForm.gpt_total_epoch}
          runningId={runningId}
          versionOptions={VERSION_OPTIONS}
          renderField={renderField}
          renderPathField={renderPathField}
          renderSelectField={renderSelectField}
          onRoleChange={handleTrainingRoleChange}
          onProjectNameChange={(value) => setTrainingForm((prev) => ({ ...prev, project_name: value }))}
          onOutputDirChange={(value) => setTrainingForm((prev) => ({ ...prev, output_dir: value }))}
          onVersionChange={(value) => setTrainingForm((prev) => ({ ...prev, version: value }))}
          onBatchSizeChange={(value) => setTrainingForm((prev) => ({ ...prev, gpt_batch_size: value }))}
          onEpochChange={(value) => setTrainingForm((prev) => ({ ...prev, gpt_total_epoch: value }))}
          onStart={() => executeRequest('training-gpt', 'POST', '/training/gpt/start', 'form', {
            exp_name: trainingForm.project_name,
            exp_root: trainingForm.output_dir,
            version: trainingForm.version,
            batch_size: trainingForm.gpt_batch_size,
            total_epoch: trainingForm.gpt_total_epoch,
          })}
        />
      );
    }

    if (activeModule === 'inference') {
      return (
        <InferenceTestPage
          selectedRoleName={selectedInferenceRole}
          workspaceOptions={workspaceOptions}
          gptModelPath={inferenceForm.gpt_path}
          sovitsModelPath={inferenceForm.sovits_path}
          refAudioPath={inferenceForm.ref_audio_path}
          promptText={inferenceForm.prompt_text}
          promptLanguage={inferenceForm.prompt_language}
          text={inferenceForm.text}
          textLanguage={inferenceForm.text_language}
          howToCut={inferenceForm.how_to_cut}
          topK={inferenceForm.top_k}
          topP={inferenceForm.top_p}
          temperature={inferenceForm.temperature}
          refAudioFile={inferenceRefAudioFile}
          runningId={runningId}
          languageOptions={LANGUAGE_OPTIONS}
          renderField={renderField}
          renderPathField={renderPathField}
          renderSelectField={renderSelectField}
          onRoleChange={handleInferenceRoleChange}
          onGptModelChange={(value) => setInferenceForm((prev) => ({ ...prev, gpt_path: value }))}
          onSovitsModelChange={(value) => setInferenceForm((prev) => ({ ...prev, sovits_path: value }))}
          onRefAudioPathChange={(value) => setInferenceForm((prev) => ({ ...prev, ref_audio_path: value }))}
          onPromptTextChange={(value) => setInferenceForm((prev) => ({ ...prev, prompt_text: value }))}
          onPromptLanguageChange={(value) => setInferenceForm((prev) => ({ ...prev, prompt_language: value }))}
          onTextChange={(value) => setInferenceForm((prev) => ({ ...prev, text: value }))}
          onTextLanguageChange={(value) => setInferenceForm((prev) => ({ ...prev, text_language: value }))}
          onHowToCutChange={(value) => setInferenceForm((prev) => ({ ...prev, how_to_cut: value }))}
          onTopKChange={(value) => setInferenceForm((prev) => ({ ...prev, top_k: value }))}
          onTopPChange={(value) => setInferenceForm((prev) => ({ ...prev, top_p: value }))}
          onTemperatureChange={(value) => setInferenceForm((prev) => ({ ...prev, temperature: value }))}
          onRefAudioSelected={(files) => setInferenceRefAudioFile(files && files.length > 0 ? files[0] : null)}
          onClearRefAudio={() => setInferenceRefAudioFile(null)}
          onPromptTextAsr={() => {
            void executeInferencePromptAsr();
          }}
          onLoadModels={() => executeRequest('inference-load-models', 'POST', '/inference/models/load', 'form', {
            gpt_path: inferenceForm.gpt_path,
            sovits_path: inferenceForm.sovits_path,
          })}
          onStartInference={() => {
            const payload = {
              text: inferenceForm.text,
              text_language: inferenceForm.text_language,
              ref_audio_path: inferenceForm.ref_audio_path,
              prompt_text: inferenceForm.prompt_text,
              prompt_language: inferenceForm.prompt_language,
              how_to_cut: inferenceForm.how_to_cut,
              top_k: inferenceForm.top_k,
              top_p: inferenceForm.top_p,
              temperature: inferenceForm.temperature,
            };
            if (inferenceRefAudioFile) {
              void executeMultipart(
                'inference-tts',
                '/inference/tts',
                payload,
                [],
                { ref_audio: [inferenceRefAudioFile] }
              );
              return;
            }
            void executeRequest('inference-tts', 'POST', '/inference/tts', 'form', payload);
          }}
        />
      );
    }

    return (
      <CustomRequestTestPage
        method={customMethod}
        contentType={customContentType}
        path={customPath}
        body={customBody}
        runningId={runningId}
        onMethodChange={setCustomMethod}
        onContentTypeChange={setCustomContentType}
        onPathChange={setCustomPath}
        onBodyChange={setCustomBody}
        onStart={executeCustom}
      />
    );
  };

  return (
    <MainLayout
      currentView={AppView.BACKEND_TEST}
      title="后端功能测试"
      subtitle="先测实际功能链路，再看底层路由。当前优先按官方流程验证：切分、标注、1A、1B、1C、训练。"
      hideHeader
      contentClassName="min-h-0"
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="min-h-0">
          <div className="theme-section-soft flex h-full min-h-0 flex-col rounded-2xl border">
            <TestSidebar
              modules={TEST_MODULES}
              activeModule={activeModule}
              isRefreshingWorkspaces={isRefreshingWorkspaces}
              onModuleChange={(moduleId) => setActiveModule(moduleId as TestModuleId)}
              onRefreshWorkspaces={() => {
                void loadWorkspaces();
              }}
            />
          </div>
        </aside>

        <div className="flex min-h-0 flex-col">
          <div className="theme-card flex min-h-0 flex-1 flex-col rounded-2xl border p-5">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {renderFunctionalPanel()}
            </div>
          </div>
        </div>

        <aside className="min-h-0">
          <TestResultPanel result={result} errorText={errorText} prettyJson={prettyJson} />
        </aside>
      </div>
    </MainLayout>
  );
};

export default BackendTestPage;
