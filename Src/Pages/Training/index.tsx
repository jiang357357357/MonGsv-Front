import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BrainCircuit,
  Cpu,
  Database,
  FolderCog,
  FolderOpen,
  Globe,
  Layers,
  Loader2,
  Pause,
  Play,
  Upload,
} from 'lucide-react';
import CustomSelect from '../Emotion/Components/CustomSelect';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import './training-workbench.css';
import { AppView } from '../../types';
import { createLogger } from '../../../System/Log/logger';
import { useTrainingSimulation } from './hooks';
import { TRAINING_PHASES } from './constants';
import { TrainingParams } from './types';
import {
  getRoleWorkspaces,
  getRolesByWorld,
  getTrainingVersions,
  getWorlds,
  RoleInfo,
  RoleWorkspaceInfo,
  selectLocalDirectory,
  selectLocalFile,
  WorldInfo,
} from './Services/trainingApi';
import TrainingMonitor from './Components/TrainingMonitor';
import TrainingParamsSection from './Components/TrainingParamsSection';

const logger = createLogger('pages/training', 'index');

const LANGUAGE_OPTIONS = [
  { value: 'zh', label: '中文' },
  { value: 'yue', label: '粤语' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'auto', label: '自动识别' },
] as const;

const trimTrailingSeparators = (value: string): string => value.replace(/[\\\/]+$/, '');

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

const basenameFromPath = (value: string): string => {
  const trimmed = trimTrailingSeparators(value);
  if (!trimmed) {
    return '';
  }
  const normalized = trimmed.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  return index >= 0 ? normalized.slice(index + 1) : normalized;
};

const joinPath = (...parts: string[]): string => {
  const validParts = parts.filter(Boolean);
  if (validParts.length === 0) {
    return '';
  }
  const separator = validParts[0].includes('\\') ? '\\' : '/';
  return validParts
    .map((part, index) => (index === 0 ? trimTrailingSeparators(part) : part.replace(/^[\\/]+|[\\/]+$/g, '')))
    .join(separator);
};

const fallbackPath = (current: string, derived?: string): string => current || derived || '';

const buildListFilePath = (workspace: RoleWorkspaceInfo | null, currentValue: string): string => {
  if (!workspace) {
    return currentValue;
  }
  const slicedName = basenameFromPath(workspace.sliced_dir) || 'sliced';
  return joinPath(workspace.role_root, 'dataset', 'asr', `${slicedName}.list`);
};

const normalizePathSegment = (value: string): string =>
  value.trim().replace(/[\\/:*?"<>|]+/g, '_');

const AUDIO_FILE_EXTENSIONS = new Set(['wav', 'mp3', 'flac', 'm4a', 'ogg', 'aac', 'wma', 'opus']);

const isAudioFile = (file: File): boolean => {
  if (file.type.startsWith('audio/')) {
    return true;
  }
  const extension = file.name.split('.').pop()?.toLowerCase();
  return Boolean(extension && AUDIO_FILE_EXTENSIONS.has(extension));
};

type BrowserFileSystemEntry = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
};

type BrowserFileSystemFileEntry = BrowserFileSystemEntry & {
  file: (success: (file: File) => void, error?: (error: DOMException) => void) => void;
};

type BrowserFileSystemDirectoryReader = {
  readEntries: (
    success: (entries: BrowserFileSystemEntry[]) => void,
    error?: (error: DOMException) => void,
  ) => void;
};

type BrowserFileSystemDirectoryEntry = BrowserFileSystemEntry & {
  createReader: () => BrowserFileSystemDirectoryReader;
};

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => BrowserFileSystemEntry | null;
};

const readFileEntry = (entry: BrowserFileSystemFileEntry): Promise<File[]> =>
  new Promise((resolve) => {
    entry.file(
      (file) => resolve(isAudioFile(file) ? [file] : []),
      () => resolve([]),
    );
  });

const readDirectoryEntry = async (entry: BrowserFileSystemDirectoryEntry): Promise<File[]> => {
  const reader = entry.createReader();
  const allEntries: BrowserFileSystemEntry[] = [];

  while (true) {
    const entries = await new Promise<BrowserFileSystemEntry[]>((resolve) => {
      reader.readEntries(resolve, () => resolve([]));
    });
    if (entries.length === 0) {
      break;
    }
    allEntries.push(...entries);
  }

  const nestedFiles = await Promise.all(allEntries.map(readDroppedEntry));
  return nestedFiles.flat();
};

const readDroppedEntry = (entry: BrowserFileSystemEntry): Promise<File[]> => {
  if (entry.isFile) {
    return readFileEntry(entry as BrowserFileSystemFileEntry);
  }
  if (entry.isDirectory) {
    return readDirectoryEntry(entry as BrowserFileSystemDirectoryEntry);
  }
  return Promise.resolve([]);
};

const readDroppedAudioFiles = async (dataTransfer: DataTransfer): Promise<File[]> => {
  const entries = Array.from(dataTransfer.items || [])
    .map((item) => (item as DataTransferItemWithEntry).webkitGetAsEntry?.() as BrowserFileSystemEntry | null | undefined)
    .filter(Boolean) as BrowserFileSystemEntry[];

  if (entries.length > 0) {
    const nestedFiles = await Promise.all(entries.map(readDroppedEntry));
    return nestedFiles.flat();
  }

  return Array.from(dataTransfer.files || []).filter(isAudioFile);
};

const buildDerivedTrainingPaths = (
  worldName: string,
  roleName: string,
  version: string,
): { inputAudioDir: string; outputDir: string } | null => {
  const world = normalizePathSegment(worldName);
  const role = normalizePathSegment(roleName);
  const baseVersion = normalizePathSegment(version);

  if (!world || !role || !baseVersion) {
    return null;
  }

  return {
    inputAudioDir: `Resources/Train/Projects/${world}/${role}/${baseVersion}/source/raw`,
    outputDir: `Resources/Model/${world}/${role}/${baseVersion}`,
  };
};

const findMatchingWorkspace = (
  workspaces: RoleWorkspaceInfo[],
  roleName: string,
  worldName: string,
): RoleWorkspaceInfo | null => {
  if (!roleName) {
    return null;
  }
  return (
    workspaces.find(
      (item) =>
        item.role_name === roleName && (!worldName || !item.world_name || item.world_name === worldName)
    ) ||
    workspaces.find((item) => item.role_name === roleName) ||
    null
  );
};

const formatFileSize = (size: number): string => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

type TrainingPanel = 'identity' | 'monitor';

interface NavItem {
  id: TrainingPanel;
  label: string;
  hint: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  state: 'ready' | 'pending' | 'running' | 'error';
}

const TrainingDashboard: React.FC = () => {
  const [params, setParams] = useState<TrainingParams>({
    preprocessingMode: 'full',
    version: '',
    language: 'zh',
    worldId: null,
    worldName: '',
    roleId: null,
    characterName: '',
    inputAudioDir: '',
    listFile: '',
    outputDir: 'Data/Output',
    trainSovits: true,
    trainGpt: true,
    trainingOrder: 'sovits_first',
    sovitsBatchSize: 4,
    sovitsEpoch: 8,
    gptBatchSize: 4,
    gptEpoch: 15,
    gpuNumbers: '0',
  });

  const [versions, setVersions] = useState<string[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [versionError, setVersionError] = useState<string | null>(null);

  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [isLoadingWorlds, setIsLoadingWorlds] = useState(true);
  const [worldError, setWorldError] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleWorkspaces, setRoleWorkspaces] = useState<RoleWorkspaceInfo[]>([]);
  const [selectedAudioFiles, setSelectedAudioFiles] = useState<File[]>([]);
  const [activePanel, setActivePanel] = useState<TrainingPanel>('identity');
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const audioDirectoryInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isTraining,
    phaseStatuses,
    completedPhases,
    error,
    currentMessage,
    toggleTraining,
    getSubStepStatus,
  } = useTrainingSimulation(params, selectedAudioFiles);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingVersions(true);
      setVersionError(null);
      try {
        const versionList = await getTrainingVersions();
        setVersions(versionList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载版本列表失败';
        setVersionError(errorMessage);
        logger.error('加载版本列表失败', { error: err });
      } finally {
        setIsLoadingVersions(false);
      }

      setIsLoadingWorlds(true);
      setWorldError(null);
      try {
        const ws = await getWorlds();
        setWorlds(ws);
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载世界列表失败';
        setWorldError(message);
        logger.error('加载世界列表失败', { error: err });
      } finally {
        setIsLoadingWorlds(false);
      }

      try {
        const workspaces = await getRoleWorkspaces();
        setRoleWorkspaces(workspaces);
      } catch (err) {
        logger.warn('加载角色工作区列表失败', { error: err });
      }
    };

    void loadInitialData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setParams((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }

    if (target instanceof HTMLInputElement && target.type === 'number') {
      setParams((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
      return;
    }

    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const applyVersion = async (value: string) => {
    setParams((prev) => ({
      ...prev,
      version: value,
    }));
  };

  const applyWorld = async (value: string) => {
    const worldName = value.trim();
    const world = worlds.find((w) => w.name === worldName) || null;
    const worldId = world ? world.id : null;
    setParams((prev) => ({
      ...prev,
      worldId,
      worldName,
      roleId: null,
      characterName: '',
    }));
    setRoles([]);
    setRoleError(null);
    if (!worldId || !worldName) {
      return;
    }
    setIsLoadingRoles(true);
    try {
      const rs = await getRolesByWorld(worldId);
      setRoles(rs);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载角色列表失败';
      setRoleError(message);
      logger.error('加载角色列表失败', { error: err });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const applyRole = (value: string) => {
    const roleName = value.trim();
    const role = roles.find((r) => r.name === roleName) || null;
    const roleId = role ? role.id : null;
    const workspace = findMatchingWorkspace(roleWorkspaces, roleName, params.worldName);
    const derivedPaths = buildDerivedTrainingPaths(
      params.worldName,
      roleName,
      params.version,
    );
    setParams((prev) => ({
      ...prev,
      roleId,
      characterName: roleName,
      inputAudioDir:
        prev.preprocessingMode === 'existing'
          ? workspace?.sliced_dir || fallbackPath(prev.inputAudioDir, derivedPaths?.inputAudioDir)
          : workspace?.raw_dir || derivedPaths?.inputAudioDir || prev.inputAudioDir,
      listFile:
        prev.preprocessingMode === 'existing'
          ? buildListFilePath(workspace, prev.listFile)
          : prev.listFile,
      outputDir:
        (workspace ? dirnameFromPath(workspace.role_root) : '') || derivedPaths?.outputDir || prev.outputDir,
    }));
  };

  useEffect(() => {
    const roleName = (params.characterName || '').trim();
    if (!roleName) {
      return;
    }
    const workspace = findMatchingWorkspace(roleWorkspaces, roleName, params.worldName || '');
    const derivedPaths = buildDerivedTrainingPaths(
      params.worldName || '',
      roleName,
      params.version,
    );
    setParams((prev) => ({
      ...prev,
      inputAudioDir:
        prev.preprocessingMode === 'existing'
          ? workspace?.sliced_dir || fallbackPath(prev.inputAudioDir, derivedPaths?.inputAudioDir)
          : workspace?.raw_dir || derivedPaths?.inputAudioDir || prev.inputAudioDir,
      listFile:
        prev.preprocessingMode === 'existing'
          ? buildListFilePath(workspace, prev.listFile)
          : prev.listFile,
      outputDir:
        (workspace ? dirnameFromPath(workspace.role_root) : '') || derivedPaths?.outputDir || prev.outputDir,
    }));
  }, [roleWorkspaces, params.characterName, params.worldName, params.version, params.preprocessingMode]);

  const handleRoleBlur = () => {
    applyRole(params.characterName || '');
  };

  const handleRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyRole(e.currentTarget.value || '');
    }
  };

  const roleName = (params.characterName || '').trim();
  const selectedWorkspace = findMatchingWorkspace(roleWorkspaces, roleName, params.worldName || '');
  const hasExistingRawAudio = Boolean(selectedWorkspace?.raw_files?.length);
  const hasPendingAudioFiles = selectedAudioFiles.length > 0;
  const isExistingDatasetMode = params.preprocessingMode === 'existing';
  const hasExistingDatasetSource = Boolean(params.inputAudioDir.trim() && params.listFile.trim());
  const hasTrainingAudioSource = isExistingDatasetMode
    ? hasExistingDatasetSource
    : hasExistingRawAudio || hasPendingAudioFiles;
  const canStartTraining = Boolean(
    params.worldName?.trim() && roleName && params.version.trim() && hasTrainingAudioSource
  );
  const startDisabledReason = !params.worldName?.trim()
    ? '请先选择世界'
    : !roleName
      ? '请先选择或填写角色'
      : !params.version.trim()
      ? '请先选择版本'
    : isExistingDatasetMode && !params.inputAudioDir.trim()
      ? '请填写切分音频目录'
    : isExistingDatasetMode && !params.listFile.trim()
      ? '请填写标注文件'
    : !hasTrainingAudioSource
        ? '请先选择训练音频'
        : '开始训练任务';

  const completedCount = completedPhases.length;
  const nextAction = !params.worldName?.trim()
    ? '先选择世界'
    : !roleName
      ? '选择角色'
      : !params.version.trim()
        ? '选择基础模型版本'
        : isExistingDatasetMode && !params.inputAudioDir.trim()
          ? '填写切分音频目录'
          : isExistingDatasetMode && !params.listFile.trim()
            ? '填写标注文件'
        : !hasTrainingAudioSource
            ? '选择训练音频'
              : !isTraining
              ? '可以启动完整训练'
              : '等待当前阶段完成';

  const handleAudioSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setSelectedAudioFiles([]);
      return;
    }
    const audioFiles = Array.from(files).filter(isAudioFile);
    setSelectedAudioFiles(audioFiles.length > 0 ? audioFiles : [files[0]]);
  };

  const handleAudioDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingAudio(false);
    if (isTraining || !roleName) {
      return;
    }
    const audioFiles = await readDroppedAudioFiles(event.dataTransfer);
    if (audioFiles.length > 0) {
      setSelectedAudioFiles(audioFiles);
    }
  };

  const selectedAudioFile = selectedAudioFiles[0] ?? null;
  const selectedAudioPreviewUrl = useMemo(
    () => (selectedAudioFile ? URL.createObjectURL(selectedAudioFile) : null),
    [selectedAudioFile]
  );

  useEffect(() => {
    return () => {
      if (selectedAudioPreviewUrl) {
        URL.revokeObjectURL(selectedAudioPreviewUrl);
      }
    };
  }, [selectedAudioPreviewUrl]);

  useEffect(() => {
    if (!audioDirectoryInputRef.current) {
      return;
    }
    audioDirectoryInputRef.current.setAttribute('webkitdirectory', '');
    audioDirectoryInputRef.current.setAttribute('directory', '');
  }, []);

  const removeAudioFile = () => {
    setSelectedAudioFiles([]);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
    if (audioDirectoryInputRef.current) {
      audioDirectoryInputRef.current.value = '';
    }
  };

  const handleAudioDirectorySelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setSelectedAudioFiles([]);
      return;
    }
    const audioFiles = Array.from(files).filter(isAudioFile);
    setSelectedAudioFiles(audioFiles);
  };

  const chooseExistingAudioDirectory = async () => {
    try {
      const path = await selectLocalDirectory('选择切分音频目录', params.inputAudioDir || '');
      if (path) {
        setParams((prev) => ({ ...prev, inputAudioDir: path }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '打开文件夹选择器失败';
      logger.error('选择切分音频目录失败', { error: err });
      window.alert(message);
    }
  };

  const chooseExistingListFile = async () => {
    try {
      const path = await selectLocalFile(
        '选择标注 list 文件',
        params.listFile ? dirnameFromPath(params.listFile) : params.inputAudioDir,
        [['List files', '*.list'], ['Text files', '*.txt'], ['All files', '*.*']],
      );
      if (path) {
        setParams((prev) => ({ ...prev, listFile: path }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '打开文件选择器失败';
      logger.error('选择标注文件失败', { error: err });
      window.alert(message);
    }
  };

  const navItems: NavItem[] = [
    {
      id: 'identity',
      label: '训练准备',
      hint: params.inputAudioDir ? `${params.worldName || '世界与角色'} / 数据目录` : params.worldName || '对象 + 数据',
      icon: Layers,
      state:
        params.worldName && roleName && params.version && hasTrainingAudioSource
          ? 'ready'
          : 'pending',
    },
    {
      id: 'monitor',
      label: '训练监控',
      hint: currentMessage || '查看阶段状态',
      icon: Activity,
      state: error ? 'error' : isTraining ? 'running' : completedCount > 0 ? 'ready' : 'pending',
    },
  ];

  const stateClass = (state: NavItem['state']) => {
    if (state === 'error') return 'text-[var(--color-danger-500)]';
    if (state === 'running') return 'theme-accent-text';
    if (state === 'ready') return 'text-[var(--color-success-500)]';
    return 'theme-kicker';
  };

  const renderPreparation = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,360px)_minmax(220px,260px)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="min-w-0">
            <CustomSelect
              className="training-select-large training-prep-select"
              label="所属世界"
              icon={<Globe className="theme-info-text h-4 w-4" />}
              value={params.worldName || ''}
              options={worlds.map((w) => ({ id: w.name, name: w.name }))}
              onChange={applyWorld}
              isLoading={isLoadingWorlds}
              placeholder="选择或输入世界"
              align="left"
              variant="filled"
            />
          </div>
          <div className="min-w-0">
            <CustomSelect
              className="training-select-large training-prep-select"
              label="模型版本"
              icon={<Layers className="theme-accent-text h-4 w-4" />}
              value={params.version}
              options={versions.map((v) => ({ id: v, name: v }))}
              onChange={applyVersion}
              disabled={!params.worldName}
              isLoading={isLoadingVersions}
              placeholder={!params.worldName ? '请先选择世界' : '选择或输入版本'}
              align="left"
              variant="filled"
            />
          </div>
          <div className="training-prep-card theme-section flex min-h-[132px] items-center justify-between gap-5 rounded-xl px-6 py-6">
            <div className="theme-title flex items-center gap-3 whitespace-nowrap text-base font-black">
              <Layers className="h-5 w-5" /> 角色名称
            </div>
            <div className="relative w-full max-w-[248px]">
              <input
                id="role"
                name="characterName"
                value={params.characterName}
                onChange={handleChange}
                onBlur={handleRoleBlur}
                onKeyDown={handleRoleKeyDown}
                disabled={isTraining || !params.worldName}
                aria-label="角色"
                list="role-options"
                placeholder={
                  !params.worldName
                    ? '请先选择世界'
                    : '输入角色名'
                }
                className="theme-input w-full rounded-xl bg-[rgba(255,255,255,0.94)] px-5 py-4 text-right text-xl font-black transition-all disabled:opacity-50"
              />
              <datalist id="role-options">
                {roles.map((role) => (
                  <option key={role.id} value={role.name} />
                ))}
              </datalist>
              {isLoadingRoles ? (
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="theme-kicker h-4 w-4 animate-spin" />
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {versionError ? (
              <div className="theme-status-block-danger rounded-lg px-4 py-3 text-sm font-medium">
                版本列表加载失败: {versionError}
              </div>
            ) : null}
            {worldError ? (
              <div className="theme-status-block-danger rounded-lg px-4 py-3 text-sm font-medium">
                世界列表加载失败: {worldError}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="training-prep-card theme-section flex min-h-[132px] flex-col gap-3 rounded-xl px-5 py-5">
            <label htmlFor="gpuNumbers" className="theme-title flex items-center gap-3 text-base font-black">
              <Cpu className="h-5 w-5" /> GPU 编号
            </label>
            <input
              id="gpuNumbers"
              name="gpuNumbers"
              value={params.gpuNumbers}
              onChange={handleChange}
              type="text"
              placeholder="0,1,2"
              disabled={isTraining}
              className="theme-input w-full rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-center text-lg font-black transition-all disabled:opacity-50"
            />
          </div>

          <div className="training-prep-card theme-section flex min-h-[132px] flex-col gap-3 rounded-xl px-5 py-5">
            <label htmlFor="preprocessingMode" className="theme-title flex items-center gap-3 text-base font-black">
              <Database className="h-5 w-5" /> 预处理模式
            </label>
            <select
              id="preprocessingMode"
              name="preprocessingMode"
              value={params.preprocessingMode}
              onChange={handleChange}
              disabled={isTraining}
              className="theme-input w-full rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-center text-lg font-black disabled:opacity-50"
            >
              <option value="full">完整流程</option>
              <option value="existing">已有标注</option>
            </select>
          </div>

          <div className="training-prep-card theme-section flex min-h-[132px] flex-col gap-3 rounded-xl px-5 py-5">
            <label htmlFor="language" className="theme-title text-base font-black">
              标注语言
            </label>
            <select
              id="language"
              name="language"
              value={params.language}
              onChange={handleChange}
              disabled={isTraining}
              className="theme-input w-full rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-center text-lg font-black disabled:opacity-50"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="theme-section rounded-xl px-5 py-5">
          <div className="flex flex-col gap-4">
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                if (!isTraining && roleName && !isExistingDatasetMode) {
                  setIsDraggingAudio(true);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!isTraining && roleName && !isExistingDatasetMode) {
                  setIsDraggingAudio(true);
                }
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                const nextTarget = event.relatedTarget as Node | null;
                if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                  setIsDraggingAudio(false);
                }
              }}
              onDrop={handleAudioDrop}
              onClick={() => {
                if (!isTraining && roleName && !isExistingDatasetMode) {
                  audioInputRef.current?.click();
                }
              }}
              className={`training-upload-dropzone transition-all ${
                isTraining || !roleName
                  ? 'cursor-not-allowed opacity-70'
                  : isExistingDatasetMode
                    ? 'cursor-default'
                  : 'cursor-pointer'
              } ${isDraggingAudio ? 'training-upload-dropzone-active' : ''}`}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg,.aac"
                disabled={isTraining || !roleName || isExistingDatasetMode}
                onChange={(event) => handleAudioSelected(event.target.files)}
                className="hidden"
              />
              <input
                ref={audioDirectoryInputRef}
                type="file"
                multiple
                disabled={isTraining || !roleName || isExistingDatasetMode}
                onChange={(event) => handleAudioDirectorySelected(event.target.files)}
                className="hidden"
              />
              <div className="flex min-h-[260px] flex-col gap-5">
                <div className="training-upload-panel flex min-h-0 flex-1 flex-col px-4 py-4">
                  <div className="training-upload-filelist min-h-0 flex-1">
                    {isExistingDatasetMode ? (
                      <div
                        className="training-upload-empty flex h-full min-h-[260px] flex-col justify-center gap-4 px-5 py-5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <div className="training-upload-dropzone-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem]">
                            <Database className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="theme-title text-xl font-black">已有标注数据</div>
                            <div className="theme-subtitle mt-1 text-sm">使用切分音频目录和 .list 标注文件</div>
                          </div>
                        </div>
                        <label className="block">
                          <span className="theme-subtitle mb-2 block text-sm font-black">切分音频目录</span>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              name="inputAudioDir"
                              value={params.inputAudioDir}
                              onChange={handleChange}
                              disabled={isTraining}
                              className="theme-input min-w-0 flex-1 rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 font-mono text-xs transition-all disabled:opacity-50"
                            />
                            <button
                              type="button"
                              onClick={chooseExistingAudioDirectory}
                              disabled={isTraining}
                              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${
                                isTraining ? 'theme-button-disabled' : 'theme-section'
                              }`}
                            >
                              <FolderOpen className="h-4 w-4" />
                              选择语音文件夹
                            </button>
                          </div>
                        </label>
                        <label className="block">
                          <span className="theme-subtitle mb-2 block text-sm font-black">标注文件</span>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              name="listFile"
                              value={params.listFile}
                              onChange={handleChange}
                              disabled={isTraining}
                              className="theme-input min-w-0 flex-1 rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 font-mono text-xs transition-all disabled:opacity-50"
                            />
                            <button
                              type="button"
                              onClick={chooseExistingListFile}
                              disabled={isTraining}
                              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${
                                isTraining ? 'theme-button-disabled' : 'theme-section'
                              }`}
                            >
                              选择 list 文件
                            </button>
                          </div>
                        </label>
                      </div>
                    ) : selectedAudioFile && selectedAudioPreviewUrl ? (
                      <div className="training-upload-player flex h-full flex-col justify-center rounded-2xl px-6 py-6">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="truncate text-2xl font-black">{selectedAudioFile.name}</div>
                            <div className="theme-subtitle mt-1 text-base">
                              {selectedAudioFiles.length > 1
                                ? `已选择 ${selectedAudioFiles.length} 个音频`
                                : formatFileSize(selectedAudioFile.size)}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isTraining}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeAudioFile();
                            }}
                            className="theme-button-danger-ghost rounded-xl px-4 py-3 text-base font-bold"
                          >
                            删除
                          </button>
                        </div>
                        <audio
                          controls
                          preload="metadata"
                          src={selectedAudioPreviewUrl}
                          className="training-audio-player w-full"
                          onClick={(event) => event.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <div className="training-upload-empty flex h-full min-h-[108px] flex-col items-center justify-center px-4">
                        <div className="training-upload-dropzone-icon mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem]">
                          <Upload className="h-7 w-7" />
                        </div>
                        <div className="theme-title text-center text-2xl font-black">
                          {isExistingDatasetMode
                            ? '使用已有切分目录'
                            : roleName
                              ? '拖入音频文件或点击这里选择'
                              : '先选择角色'}
                        </div>
                        {!roleName ? (
                          <div className="theme-subtitle mt-3 text-center text-base">选择角色后即可加入训练音频。</div>
                        ) : null}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              audioInputRef.current?.click();
                            }}
                            disabled={isTraining || !roleName || isExistingDatasetMode}
                            className={`rounded-2xl px-7 py-4 text-lg font-black ${
                              isTraining || !roleName || isExistingDatasetMode
                                ? 'theme-button-disabled'
                                : 'theme-section'
                            }`}
                          >
                            选择文件
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              audioDirectoryInputRef.current?.click();
                            }}
                            disabled={isTraining || !roleName || isExistingDatasetMode}
                            className={`inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-lg font-black ${
                              isTraining || !roleName || isExistingDatasetMode
                                ? 'theme-button-disabled'
                                : 'theme-section'
                            }`}
                          >
                            <FolderOpen className="h-5 w-5" />
                            选择文件夹
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {!isExistingDatasetMode ? (
                    <label
                      className="mt-4 block"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className="theme-subtitle mb-2 block text-sm font-black">原始音频目录</span>
                      <input
                        name="inputAudioDir"
                        value={params.inputAudioDir}
                        onChange={handleChange}
                        disabled={isTraining}
                        className="theme-input w-full rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 font-mono text-xs transition-all disabled:opacity-50"
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            </div>

            {roleError ? (
              <div className="theme-status-block-danger rounded-xl px-4 py-3 text-sm font-medium">{roleError}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.9fr)]">
        <div className="theme-section rounded-xl px-5 py-5">
          <div className="mb-4 flex items-center gap-2">
            <FolderCog className="theme-accent-text h-5 w-5" />
            <h3 className="theme-title text-xl font-black">训练参数</h3>
          </div>
          <TrainingParamsSection params={params} isTraining={isTraining} onChange={handleChange} />
        </div>

        <div className="theme-section rounded-xl px-5 py-5">
          <div className="mb-4 flex items-center gap-2">
            <BrainCircuit className="theme-accent-text h-5 w-5" />
            <h3 className="theme-title text-xl font-black">训练操作</h3>
          </div>
          <div>
            <div className="group relative" title={!isTraining && !canStartTraining ? startDisabledReason : ''}>
              <button
                onClick={toggleTraining}
                disabled={!isTraining && !canStartTraining}
                className={`w-full rounded-xl px-4 py-4 text-sm font-bold transition-all ${
                  isTraining
                    ? 'theme-status-block-warning'
                    : !canStartTraining
                      ? 'theme-button-disabled'
                      : 'theme-button-amber'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isTraining ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  <span>{isTraining ? '停止当前训练' : '开始完整训练'}</span>
                </div>
                <div className="mt-2 text-center text-xs font-medium opacity-80">包含预处理、SoVITS、GPT 的完整工作流</div>
              </button>
              {!isTraining && !canStartTraining ? (
                <div className="theme-subtitle mt-3 text-center text-sm">当前缺少：{startDisabledReason}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitor = () => (
    <section className="theme-section rounded-xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="theme-accent-text h-4 w-4" />
        <h3 className="theme-title text-base font-black">训练监控</h3>
      </div>
      <div className="min-h-[560px]">
        <TrainingMonitor
          isTraining={isTraining}
          phaseStatuses={phaseStatuses}
          error={error}
          currentMessage={currentMessage}
          getSubStepStatus={getSubStepStatus}
        />
      </div>
    </section>
  );

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'identity':
        return renderPreparation();
      case 'monitor':
        return renderMonitor();
      default:
        return null;
    }
  };

  return (
    <MainLayout
      title="训练工作台"
      subtitle="围绕角色、数据预处理、训练执行和状态监控组织的统一训练页面。"
      currentView={AppView.TRAINING}
      hideHeader
      contentClassName="min-h-0"
    >
      <div className="training-workbench flex min-h-0 flex-col gap-0 pb-4">
        <div className="relative z-10 flex flex-wrap items-end gap-2 px-2">
          {navItems.map((item) => {
            const isActive = item.id === activePanel;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePanel(item.id)}
                className={`training-tab min-w-[170px] rounded-t-2xl border border-b-0 px-4 py-3 text-left transition-all ${
                  isActive
                    ? 'theme-nav-item-active training-tab-active translate-y-px shadow-sm'
                    : 'theme-section-sunken training-tab-inactive opacity-95 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`theme-nav-icon mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? '' : 'bg-transparent border-transparent'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? '' : stateClass(item.state)}`} />
                  </span>
                  <div className="min-w-0">
                    <div className="theme-title text-sm font-black">{item.label}</div>
                    <div className="theme-subtitle mt-1 text-[11px] leading-5">{item.hint}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <section className="theme-section-sunken training-page-surface -mt-px rounded-2xl border p-5">
          <div className="min-w-0">{renderActivePanel()}</div>
        </section>
      </div>
    </MainLayout>
  );
};

export default TrainingDashboard;
