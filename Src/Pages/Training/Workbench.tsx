import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowRight, AudioLines, Check, ChevronDown, ChevronRight, CircleHelp, Cpu, Database, FileAudio, FileText, FolderOpen, History, Layers, Play, Plus, RefreshCw, Settings2, Square, Upload, UserRound, X } from 'lucide-react';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import { AppView } from '../../types';
import { formatModelVersion } from '../../Public/modelVersions';
import { TrainingParams, TrainingPreset } from './types';
import { useTrainingWorkbench } from './hooks';
import { getRoleWorkspaces, getTrainingVersions, getWorkbenchDefaults, getWorkbenchWorkspaces, getWorlds, RoleWorkspaceInfo, selectLocalDirectory, selectLocalFile, WorkbenchWorkspaceResponse, WorldInfo } from './Services/trainingApi';
import { TrainingWorkflowStatus } from './Services/trainingResponses';
import TrainingParamsSection from './Components/TrainingParamsSection';
import TrainingMonitor from './Components/TrainingMonitor';
import TrainingRunDetails from './Components/TrainingRunDetails';
import './training-workbench.css';

// Batch values are placeholders until the backend supplies this machine's defaults.
const initialPreset: TrainingPreset = {
  sovitsBatchSize: 1, sovitsEpoch: 2, gptBatchSize: 1, gptEpoch: 15,
  gptLearningRate: 0.01, sovitsLearningRate: 0.0001,
  logInterval: 100,
  loraRank: 32, gradCheckpoint: false, fp16: true,
};
const initial: TrainingParams = {
  roleMode: 'new', version: 'v5turbo', language: 'zh', worldName: '', characterName: '',
  preprocessingMode: 'full', trainingMode: 'fresh', sourceVersion: '', sourceWorkspace: '', resumeWorkspace: '',
  inputAudioDir: '', listFile: '', outputDir: '', trainSovits: true, trainGpt: true, trainingOrder: 'sovits_first',
  gpuNumbers: '0', ...initialPreset,
};
const emptyWorkspace: WorkbenchWorkspaceResponse = { versions: [], resume_choices: [] };
const statusNames: Record<string, string> = { queued: '排队中', running: '进行中', completed: '已完成', failed: '失败', stopped: '已停止', interrupted: '监控中断' };
const isAudio = (file: File) => file.type.startsWith('audio/') || /\.(wav|mp3|flac|m4a|ogg|aac|opus|wma)$/i.test(file.name);

const SectionHeading: React.FC<{ step: string; title: string; description: string; action?: React.ReactNode }> = ({ step, title, description, action }) => (
  <div className="training-section-heading">
    <div className="training-section-intro">
      <span className="training-step-number">{step}</span>
      <div><h2>{title}</h2><p>{description}</p></div>
    </div>
    {action}
  </div>
);

const Workbench: React.FC = () => {
  const [params, setParams] = useState<TrainingParams>(initial);
  const [presets, setPresets] = useState<Record<string, TrainingPreset>>({});
  const [defaultsLoading, setDefaultsLoading] = useState(true);
  const [defaultsError, setDefaultsError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [versions, setVersions] = useState<string[]>([]);
  const [roleWorkspaces, setRoleWorkspaces] = useState<RoleWorkspaceInfo[]>([]);
  const [data, setData] = useState<WorkbenchWorkspaceResponse>(emptyWorkspace);
  const [dataLoading, setDataLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [panel, setPanel] = useState<'prepare' | 'monitor' | 'history'>('prepare');
  const [dragging, setDragging] = useState(false);
  const [sourceAudio, setSourceAudio] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const directoryInput = useRef<HTMLInputElement>(null);
  const training = useTrainingWorkbench(params, files);
  const busy = training.isTraining;
  const defaults = (version: string) => presets[version] || initialPreset;
  const loadDefaults = async () => {
    setDefaultsLoading(true); setDefaultsError('');
    try {
      const values = await getWorkbenchDefaults();
      setPresets(values);
      setParams(previous => previous.trainingMode === 'resume' ? previous : { ...previous, ...values[previous.version] });
    } catch (err) { setDefaultsError(err instanceof Error ? err.message : '读取训练默认配置失败'); }
    finally { setDefaultsLoading(false); }
  };
  useEffect(() => { void loadDefaults(); }, []);

  const refreshResources = async () => {
    const results = await Promise.allSettled([getWorlds(), getTrainingVersions(), getRoleWorkspaces()]);
    if (results[0].status === 'fulfilled') setWorlds(results[0].value);
    if (results[1].status === 'fulfilled') setVersions(results[1].value);
    if (results[2].status === 'fulfilled') setRoleWorkspaces(results[2].value);
    const failure = results.find(r => r.status === 'rejected');
    if (failure?.status === 'rejected') setPageError(String(failure.reason));
  };
  useEffect(() => { void refreshResources(); }, []);
  useEffect(() => { if (training.workflow?.status === 'completed') void refreshResources(); }, [training.workflow?.workflow_id, training.workflow?.status]);
  useEffect(() => { directoryInput.current?.setAttribute('webkitdirectory', ''); }, [params.preprocessingMode, params.trainingMode, panel]);
  useEffect(() => {
    if (!files[0]) { setSourceAudio(''); return; }
    const url = URL.createObjectURL(files[0]); setSourceAudio(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);
  useEffect(() => {
    setData(emptyWorkspace);
    setDataLoading(false);
    if (params.roleMode !== 'existing' || !params.worldName || !params.characterName) return;
    let cancelled = false;
    setDataLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await getWorkbenchWorkspaces(params.worldName!, params.characterName);
        if (cancelled) return;
        setData(result); setPageError('');
        const compatible = result.versions.filter(v => v.has_features);
        setParams(previous => {
          const source = compatible.find(v => v.version === previous.sourceVersion) || compatible.find(v => v.version === previous.version) || compatible[0];
          return { ...previous, sourceVersion: source?.version || '', sourceWorkspace: source?.workspace || '' };
        });
      } catch (err) { if (!cancelled) setPageError(err instanceof Error ? err.message : '读取训练数据失败'); }
      finally { if (!cancelled) setDataLoading(false); }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [params.worldName, params.characterName, params.roleMode, params.version, training.workflow?.status]);

  const roles = useMemo(() => [...new Set(roleWorkspaces.filter(w => w.world_name === params.worldName).map(w => w.role_name))], [roleWorkspaces, params.worldName]);
  const resumeChoices = data.resume_choices.filter(choice => choice.version === params.version);
  const duplicate = params.roleMode === 'new' && roles.some(name => name.normalize('NFKC').toLocaleLowerCase() === params.characterName.trim().normalize('NFKC').toLocaleLowerCase());
  const inputClass = 'training-control';
  const cardClass = 'training-card';
  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setParams(previous => ({ ...previous, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value }));
  };
  const field = (name: keyof TrainingParams, label: string, type = 'text', step?: string, placeholder?: string) => (
    <label className="training-field" key={name}>
      <span>{label}</span>
      <input name={name} aria-label={label} value={String(params[name] ?? '')} placeholder={placeholder} type={type} step={step} min={type === 'number' ? (step && Number(step) < 1 ? step : '1') : undefined} disabled={busy || defaultsLoading} onChange={change} className={inputClass} />
    </label>
  );
  const setVersion = (version: string) => setParams(previous => ({ ...previous, version, resumeWorkspace: '', ...defaults(version) }));
  const setRoleMode = (roleMode: 'existing' | 'new') => {
    setFiles([]);
    setParams(previous => ({ ...previous, roleMode, characterName: '', preprocessingMode: roleMode === 'existing' ? 'cached' : 'full', trainingMode: 'fresh', resumeWorkspace: '', sourceVersion: '', sourceWorkspace: '' }));
  };
  const reason = defaultsLoading ? '正在读取训练默认配置' : defaultsError ? '训练默认配置加载失败，请重试' : !params.worldName ? '请选择所属世界' : !params.characterName.trim() ? '请选择或填写角色名' : !params.version ? '请选择模型版本'
    : duplicate ? '角色已存在，请切换到已有角色' : dataLoading ? '正在读取角色数据'
    : params.trainingMode === 'resume' ? !params.resumeWorkspace ? '请选择续训记录' : ''
    : params.preprocessingMode === 'cached' ? !params.sourceWorkspace ? '请选择可用的特征数据来源' : ''
    : params.preprocessingMode === 'existing' ? !params.inputAudioDir || !params.listFile ? '请填写切分音频目录和标注文件' : ''
    : !files.length && !params.inputAudioDir ? '请上传音频或填写原始目录' : '';
  const start = async (target: 'selected' | 'gpt' | 'sovits') => {
    if (await training.start(target)) setPanel('monitor');
  };
  const chooseServerPath = async (kind: 'inputAudioDir' | 'listFile') => {
    try {
      const value = kind === 'listFile' ? await selectLocalFile('选择 .list 标注文件', '', [['标注文件', '*.list']]) : await selectLocalDirectory('选择服务器上的音频目录', params.inputAudioDir);
      if (value) setParams(previous => ({ ...previous, [kind]: value }));
    } catch (err) { setPageError(err instanceof Error ? err.message : '选择路径失败'); }
  };
  const resumeFromHistory = (run: TrainingWorkflowStatus) => {
    const options = run.options || {};
    setParams({ ...initial, ...defaults(run.version), roleMode: 'existing', worldName: run.world_name || '', characterName: run.project_name, version: run.version,
      trainingMode: 'resume', resumeWorkspace: run.project_root, trainGpt: run.order.includes('gpt'), trainSovits: run.order.includes('sovits'),
      gptEpoch: (options.gpt_total_epoch ?? 15) + 1, sovitsEpoch: (options.sovits_total_epoch ?? defaults(run.version).sovitsEpoch) + 1,
      gptBatchSize: options.gpt_batch_size ?? defaults(run.version).gptBatchSize,
      sovitsBatchSize: options.sovits_batch_size ?? defaults(run.version).sovitsBatchSize,
      gptLearningRate: options.gpt_learning_rate ?? defaults(run.version).gptLearningRate,
      sovitsLearningRate: options.sovits_learning_rate ?? defaults(run.version).sovitsLearningRate,
      gradCheckpoint: options.grad_checkpoint ?? defaults(run.version).gradCheckpoint,
      fp16: options.fp16 ?? defaults(run.version).fp16,
      logInterval: options.log_interval ?? defaults(run.version).logInterval,
      loraRank: options.lora_rank || 32, gpuNumbers: options.gpu_numbers || '0',
      sourceVersion: options.source_version || run.version, sourceWorkspace: options.source_workspace || run.project_root });
    setPanel('prepare');
  };
  const canStart = !busy && !reason;
  const hasTargets = params.trainGpt || params.trainSovits;
  const objectReady = Boolean(params.worldName && params.characterName.trim() && params.version && !duplicate);
  const dataReady = !dataLoading && (params.trainingMode === 'resume' ? Boolean(params.resumeWorkspace)
    : params.preprocessingMode === 'cached' ? Boolean(params.sourceWorkspace)
    : params.preprocessingMode === 'existing' ? Boolean(params.inputAudioDir && params.listFile)
    : Boolean(files.length || params.inputAudioDir));
  const preparation = [
    { label: '选择训练对象', ready: objectReady },
    { label: params.trainingMode === 'resume' ? '选择续训记录' : '准备训练数据', ready: dataReady },
    { label: '设置训练目标', ready: hasTargets },
  ];
  const readyCount = preparation.filter(step => step.ready).length;
  const dataModeLabel = params.trainingMode === 'resume' ? '使用续训数据' : { full: '原始音频', existing: '已有音频标注', cached: '复用特征数据' }[params.preprocessingMode];
  const selectedSource = data.versions.find(version => version.version === params.sourceVersion);
  const clearFiles = () => {
    setFiles([]);
    if (fileInput.current) fileInput.current.value = '';
    if (directoryInput.current) directoryInput.current.value = '';
  };

  return (
    <MainLayout title="训练工作台" subtitle="准备数据、训练模型、查看日志与试听。" currentView={AppView.TRAINING} hideHeader contentClassName="min-h-0">
      <div className="training-workbench">
        <nav className="training-tabs" aria-label="训练工作台导航">
          {([{ id: 'prepare', label: '训练准备', Icon: Layers }, { id: 'monitor', label: '训练监控与试听', Icon: Activity }, { id: 'history', label: '训练历史', Icon: History }] as const).map(({ id, label, Icon }) => (
            <button key={id} aria-label={label} aria-current={panel === id ? 'page' : undefined} onClick={() => setPanel(id)} className={'training-tab ' + (panel === id ? 'training-tab-active' : '')}>
              <Icon size={17} />{label}
              {id === 'history' && training.history.length > 0 && <span className="training-tab-count" aria-hidden="true">{training.history.length}</span>}
              {id === 'monitor' && busy && <span className="training-live-dot" />}
            </button>
          ))}
        </nav>
        {(pageError || training.error) && <div role="alert" className="training-error-banner">{pageError || training.error}</div>}
        {defaultsError && <div role="alert" className="training-error-banner">训练默认配置加载失败：{defaultsError} <button type="button" onClick={() => void loadDefaults()}>重新加载</button></div>}

        {panel === 'prepare' && <div className="training-prepare-layout">
          <div className="training-form-sections">
            <section className={cardClass}>
              <SectionHeading step="01" title="训练对象" description="选择已有角色，或为一个新声音创建模型。" />
              <div className="training-segmented" aria-label="角色类型">
                <button disabled={busy} aria-pressed={params.roleMode === 'existing'} onClick={() => setRoleMode('existing')}><UserRound size={15} />已有角色</button>
                <button disabled={busy} aria-pressed={params.roleMode === 'new'} onClick={() => setRoleMode('new')}><Plus size={15} />创建新角色</button>
              </div>
              <div className="training-identity-fields">
                <label className="training-field"><span>所属世界</span>
                  <select aria-label="所属世界" value={params.worldName || ''} disabled={busy} onChange={e => {
                    const worldName = e.target.value;
                    setFiles([]);
                    setParams(previous => ({ ...previous, worldName, characterName: '', sourceVersion: '', sourceWorkspace: '', resumeWorkspace: '' }));
                  }} className={inputClass}>
                    <option value="">选择所属世界</option>{worlds.map(world => <option key={world.id} value={world.name}>{world.name}</option>)}
                  </select>
                </label>
                {params.roleMode === 'existing'
                  ? <label className="training-field"><span>角色名称</span>
                    <select aria-label="已有角色" value={params.characterName} disabled={busy || !params.worldName} onChange={e => {
                      const characterName = e.target.value;
                      setParams(previous => ({ ...previous, characterName, sourceVersion: '', sourceWorkspace: '', resumeWorkspace: '' }));
                    }} className={inputClass}>
                      <option value="">{params.worldName ? '选择角色' : '请先选择世界'}</option>
                      {[...new Set([...roles, ...(params.characterName ? [params.characterName] : [])])].map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </label>
                  : field('characterName', '新角色名称', 'text', undefined, '输入角色名称')}
                <label className="training-field"><span>模型版本</span>
                  <select aria-label="模型版本" value={params.version} onChange={e => setVersion(e.target.value)} disabled={busy} className={inputClass}>
                    {versions.map(version => <option key={version} value={version}>{formatModelVersion(version)}</option>)}
                  </select>
                </label>
              </div>
              {duplicate && <p role="alert" className="training-inline-error">角色已存在，请切换到“已有角色”。</p>}
              <div className="training-starting-point">
                <label className="training-field"><span>训练起点</span>
                  <select aria-label="训练起点" name="trainingMode" value={params.trainingMode} onChange={change} disabled={busy} className={inputClass}>
                    <option value="fresh">从底模重新训练</option><option value="resume">从已有记录继续训练</option>
                  </select>
                </label>
                <p>{params.trainingMode === 'resume' ? '保留已有进度，继续训练到新的目标轮数。' : '每次创建独立的训练记录，保留历史权重。'}</p>
              </div>
            </section>

            <section className={cardClass}>
              <SectionHeading step="02" title={params.trainingMode === 'resume' ? '续训记录' : '训练数据'} description={params.trainingMode === 'resume' ? '选择与当前模型版本匹配的训练记录。' : '使用新的音频素材，或复用已经准备好的数据。'} />
              {params.trainingMode === 'resume' ? <div className="training-resume-fields">
                <label className="training-field"><span>选择训练记录</span>
                  <select aria-label="续训记录" name="resumeWorkspace" value={params.resumeWorkspace} onChange={e => {
                    const resumeWorkspace = e.target.value;
                    const choice = resumeChoices.find(c => c.workspace === resumeWorkspace);
                    setParams(previous => ({ ...previous, resumeWorkspace, loraRank: choice?.lora_ranks.find(rank => rank > 0) || previous.loraRank }));
                  }} disabled={busy || dataLoading} className={inputClass}>
                    <option value="">{dataLoading ? '正在读取训练记录…' : '请选择含 checkpoint 的记录'}</option>
                    {resumeChoices.map(choice => <option key={choice.workspace} value={choice.workspace}>{choice.label} · {choice.gpt ? 'GPT ' : ''}{choice.sovits ? 'SoVITS' : ''}</option>)}
                  </select>
                </label>
                <div className="training-info-note"><CircleHelp size={17} /><p>轮数填写累计目标。例如已经训练 12 轮，继续到 16 轮时填写 16。LoRA rank 需与原记录一致。</p></div>
              </div> : <>
                <div className="training-data-modes" role="radiogroup" aria-label="数据方式">
                  {([{ id: 'full', title: '原始音频', description: '自动切分、识别和提取特征', Icon: AudioLines }, { id: 'existing', title: '已有标注', description: '使用切分音频与 .list 文件', Icon: FileText }, { id: 'cached', title: '复用特征', description: '使用已有角色的特征数据', Icon: Database }] as const).map(({ id, title, description, Icon }) => (
                    <label key={id} className={'training-data-mode ' + (params.preprocessingMode === id ? 'is-selected ' : '') + (id === 'cached' && params.roleMode === 'new' ? 'is-disabled' : '')}>
                      <input type="radio" name="preprocessingMode" value={id} checked={params.preprocessingMode === id} disabled={busy || (id === 'cached' && params.roleMode === 'new')} onChange={change} aria-label={title} />
                      <div className="training-data-mode-top"><Icon size={20} /><span className="training-radio-mark">{params.preprocessingMode === id && <Check size={11} />}</span></div>
                      <strong>{title}</strong><span>{description}</span>
                    </label>
                  ))}
                </div>
                {params.preprocessingMode === 'cached' ? <div className="training-data-content">
                  <label className="training-field"><span>特征来源版本</span>
                    <select aria-label="特征来源版本" value={params.sourceVersion} disabled={busy || dataLoading} onChange={e => {
                      const sourceVersion = e.target.value;
                      const entry = data.versions.find(version => version.version === sourceVersion);
                      setParams(previous => ({ ...previous, sourceVersion, sourceWorkspace: entry?.workspace || '' }));
                    }} className={inputClass}>
                      <option value="">{dataLoading ? '正在读取角色数据…' : '选择已有的特征数据'}</option>
                      {data.versions.filter(version => version.has_features).map(version => <option key={version.version} value={version.version}>{formatModelVersion(version.version)} · {version.text_lines} 段标注</option>)}
                    </select>
                  </label>
                  {selectedSource ? <div className="training-feature-note"><span className="training-feature-icon"><Check size={19} /></span><div><strong>{selectedSource.text_lines} 段标注可复用</strong><p>复用音频与文本特征；切换模型版本时自动更新语义特征。</p></div></div> : <p className="training-field-hint">先选择世界和角色，再选择可用的特征数据。</p>}
                  {params.sourceWorkspace && <details className="training-path-details"><summary>查看数据目录<ChevronDown size={14} /></summary><p>{params.sourceWorkspace}</p></details>}
                </div> : <div className="training-data-content">
                  {params.preprocessingMode === 'full' && <>
                    <div className={'training-dropzone ' + (dragging ? 'is-dragging ' : '') + (busy ? 'is-disabled' : '')} onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!busy) setFiles(Array.from(e.dataTransfer.files).filter(isAudio)); }}>
                      <div className="training-upload-icon"><Upload size={24} /></div><strong>将音频拖到这里</strong><p>支持 WAV、MP3、FLAC 等常见音频格式</p>
                      <div className="training-upload-actions"><button disabled={busy} className="training-button training-button-secondary" onClick={() => fileInput.current?.click()}><Plus size={15} />选择音频</button><button disabled={busy} className="training-text-button" onClick={() => directoryInput.current?.click()}><FolderOpen size={15} />选择文件夹</button></div>
                      <input ref={fileInput} aria-label="上传音频文件" type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg,.aac" multiple hidden onChange={e => setFiles(Array.from(e.target.files || []).filter(isAudio))} />
                      <input ref={directoryInput} aria-label="上传音频文件夹" type="file" multiple hidden onChange={e => setFiles(Array.from(e.target.files || []).filter(isAudio))} />
                    </div>
                    {files.length > 0 && <div className="training-upload-selection">
                      <div className="training-upload-selection-header"><div><FileAudio size={17} /><strong>已选择 {files.length} 个音频</strong><span>{(files.reduce((size, file) => size + file.size, 0) / 1024 / 1024).toFixed(1)} MB</span></div><button disabled={busy} onClick={clearFiles} className="training-text-button" aria-label="清空已选音频"><X size={15} />清空</button></div>
                      <p className="training-selected-filenames">{files.slice(0, 3).map(file => file.name).join('、')}{files.length > 3 ? ' 等 ' + files.length + ' 个文件' : ''}</p><audio aria-label="原始音频试听" controls src={sourceAudio} />
                    </div>}
                  </>}
                  {params.preprocessingMode === 'existing' ? <div className="training-server-fields">
                    <div className="training-path-field">{field('inputAudioDir', '切分音频目录', 'text', undefined, '填写服务器上的音频目录')}<button disabled={busy} onClick={() => void chooseServerPath('inputAudioDir')} className="training-browse-button" aria-label="选择服务器目录" title="选择服务器目录"><FolderOpen size={18} /></button></div>
                    <div className="training-path-field">{field('listFile', '.list 标注文件', 'text', undefined, '填写标注文件路径')}<button disabled={busy} onClick={() => void chooseServerPath('listFile')} className="training-browse-button" aria-label="选择 .list 文件" title="选择 .list 文件"><FolderOpen size={18} /></button></div>
                  </div> : <details className="training-server-source">
                    <summary><FolderOpen size={15} />使用服务器上的音频<ChevronDown size={14} /></summary>
                    <div className="training-path-field">{field('inputAudioDir', '原始音频目录', 'text', undefined, '已上传音频时可留空')}<button disabled={busy} onClick={() => void chooseServerPath('inputAudioDir')} className="training-browse-button" aria-label="选择服务器目录" title="选择服务器目录"><FolderOpen size={18} /></button></div>
                  </details>}
                </div>}
                <div className="training-language-row">
                  <label className="training-field"><span>标注语言</span><select aria-label="标注语言" name="language" value={params.language} onChange={change} disabled={busy} className={inputClass}>{[['zh', '中文'], ['yue', '粤语'], ['en', '英语'], ['ja', '日语'], ['ko', '韩语'], ['auto', '自动识别']].map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label><p>选择音频中使用的主要语言。</p>
                </div>
              </>}
            </section>

            <section className={cardClass}>
              <SectionHeading step="03" title="训练参数" description={defaultsLoading ? '正在读取训练默认配置…' : 'Batch 按本机显存设置，每个阶段只在训练结束时保存一次。'} action={<button disabled={busy || defaultsLoading || Boolean(defaultsError)} onClick={() => setParams(previous => ({ ...previous, ...defaults(previous.version) }))} className="training-text-button"><RefreshCw size={14} />恢复默认参数</button>} />
              <TrainingParamsSection params={params} isTraining={busy || defaultsLoading} onChange={change} />
              <details className="training-advanced">
                <summary><Settings2 size={16} /><span>高级设置<small>设备、学习率与保存策略</small></span><ChevronDown size={16} /></summary>
                <div className="training-advanced-fields">
                  {field('gpuNumbers', 'GPU 编号', 'text', undefined, '例如 0 或 0,1')}
                  <label className="training-field"><span>训练顺序</span><select aria-label="训练顺序" name="trainingOrder" value={params.trainingOrder} onChange={change} disabled={busy} className={inputClass}><option value="sovits_first">先 SoVITS，后 GPT</option><option value="gpt_first">先 GPT，后 SoVITS</option></select></label>
                  {field('sovitsLearningRate', 'SoVITS 学习率', 'number', '0.00001')}{field('gptLearningRate', 'GPT 学习率', 'number', '0.001')}
                  {params.version.startsWith('v5') || ['v3', 'v4'].includes(params.version) ? field('loraRank', 'LoRA rank', 'number') : null}
                  {field('logInterval', 'SoVITS 每隔几步记录 Loss', 'number')}
                </div>
                <p className="training-selected-filenames">保存策略：SoVITS 在第 {params.sovitsEpoch} 轮、GPT 在第 {params.gptEpoch} 轮各保存一次。</p>
                <div className="training-advanced-toggles">
                  <label><input name="gradCheckpoint" type="checkbox" checked={params.gradCheckpoint} onChange={change} disabled={busy || defaultsLoading} />梯度检查点（节省显存）</label>
                  <label><input name="fp16" type="checkbox" checked={params.fp16} onChange={change} disabled={busy || defaultsLoading} />混合精度</label>
                </div>
              </details>
            </section>
          </div>

          <aside className="training-summary-column" aria-label="训练概览">
            <section className="training-summary-card">
              <div className="training-summary-heading"><span className="training-summary-icon"><Layers size={20} /></span><div><h2>本次训练</h2><p>确认配置后即可开始</p></div></div>
              <div className="training-summary-role">{busy ? training.workflow?.project_name || '正在提交训练' : params.characterName.trim() || '选择你的训练角色'}<span>{(busy ? training.workflow?.world_name : params.worldName) || '尚未选择世界'}</span></div>
              <dl className="training-summary-rows">
                <div><dt>模型版本</dt><dd>{formatModelVersion(busy ? training.workflow?.version || params.version : params.version)}</dd></div>
                <div><dt>训练起点</dt><dd>{params.trainingMode === 'resume' ? '继续已有训练' : '从底模重新训练'}</dd></div>
                <div><dt>训练数据</dt><dd>{dataModeLabel}</dd></div>
                <div><dt>训练设备</dt><dd><Cpu size={13} />GPU {params.gpuNumbers || '0'}</dd></div>
              </dl>
              <div className="training-summary-targets">
                {params.trainSovits && <span>SoVITS <strong>{params.sovitsEpoch} 轮</strong></span>}{params.trainGpt && <span>GPT <strong>{params.gptEpoch} 轮</strong></span>}{!hasTargets && <span>尚未选择训练目标</span>}
              </div>
              {!busy && <div className="training-readiness">
                <div className="training-readiness-heading"><span>准备进度</span><span>{readyCount} / 3</span></div>
                <div className="training-readiness-track"><span style={{ width: String(readyCount / 3 * 100) + '%' }} /></div>
                {preparation.map(step => <div className={'training-readiness-step ' + (step.ready ? 'is-ready' : '')} key={step.label}><span>{step.ready ? <Check size={11} /> : null}</span>{step.label}</div>)}
              </div>}
              {busy ? <div className="training-summary-actions">
                <button className="training-button training-button-primary" onClick={() => setPanel('monitor')}><Activity size={17} />查看训练监控<ArrowRight size={15} /></button>
                <button disabled={training.isSubmitting || training.workflow?.stop_requested} onClick={() => void training.stop()} className="training-button training-button-stop"><Square size={14} />{training.workflow?.stop_requested ? '正在停止…' : '停止当前训练'}</button>
              </div> : <div className="training-summary-actions">
                <button disabled={!canStart || !hasTargets} title={reason || (!hasTargets ? '请选择至少一个训练目标' : '')} onClick={() => void start('selected')} className="training-button training-button-primary"><Play size={16} fill="currentColor" />开始训练<ArrowRight size={16} /></button>
              </div>}
            </section>
          </aside>
        </div>}

        {panel === 'monitor' && (training.workflow ? <div className="training-monitor-panel">
          <div className="training-card training-run-banner"><div><span className={'training-run-status is-' + training.workflow.status}>{statusNames[training.workflow.status]}</span><h2>{training.workflow.project_name}<span>{formatModelVersion(training.workflow.version)}</span></h2><p>{training.currentMessage}</p></div>{busy && <button disabled={training.workflow.stop_requested} onClick={() => void training.stop()} className="training-button training-button-stop"><Square size={14} />停止训练</button>}</div>
          <div className="training-monitor-grid"><div className={cardClass}><TrainingMonitor isTraining={busy} phaseStatuses={training.phaseStatuses} error={training.workflow.error || training.error} currentMessage={training.currentMessage} getSubStepStatus={training.getSubStepStatus} /></div><TrainingRunDetails workflow={training.workflow} /></div>
        </div> : <section className="training-card training-empty-state">
          <span className="training-empty-icon"><Activity size={30} /></span><h2>训练进度，会在这里呈现</h2><p>启动一次训练，或从历史记录中选择任务，查看进度、曲线与试听。</p><div><button className="training-button training-button-primary" onClick={() => setPanel('prepare')}>准备训练<ArrowRight size={16} /></button><button className="training-text-button" onClick={() => setPanel('history')}>查看训练历史</button></div>
        </section>)}

        {panel === 'history' && <section className={cardClass + ' training-history-panel'}>
          <div className="training-section-heading"><div><h2>训练记录</h2><p>每一次训练的进度、参数与结果，都保留在这里。</p></div><button onClick={() => void training.refreshHistory()} className="training-button training-button-secondary"><RefreshCw size={15} />刷新记录</button></div>
          {!training.history.length ? <div className="training-empty-state"><span className="training-empty-icon"><History size={30} /></span><h2>还没有训练记录</h2><p>从准备一个角色的声音开始，创建你的第一次训练。</p><button className="training-button training-button-primary" onClick={() => setPanel('prepare')}><Plus size={16} />创建训练</button></div>
            : <div className="training-history-list">{training.history.map(run => <article key={run.workflow_id} data-run-id={run.workflow_id} className="training-history-row">
              <span className="training-history-icon"><AudioLines size={22} /></span>
              <div className="training-history-info"><div><h3>{run.project_name}</h3><span className={'training-run-status is-' + run.status}>{statusNames[run.status]}</span>{run.options?.publish_models === false && <span className="training-history-test-tag">验证任务</span>}</div><p>{run.world_name} <span>·</span> {formatModelVersion(run.version)} <span>·</span> {run.order.map(target => target.toUpperCase()).join(' → ')}</p><time>{run.created_at?.replace('T', ' ').slice(0, 16)}</time>{run.error && <p className="training-inline-error">{run.error}</p>}</div>
              <div className="training-history-actions"><button onClick={() => { training.selectRun(run); setPanel('monitor'); }} className="training-button training-button-secondary">查看详情<ChevronRight size={14} /></button>{['completed', 'stopped', 'failed', 'interrupted'].includes(run.status) && <button onClick={() => resumeFromHistory(run)} className="training-text-button">配置续训</button>}</div>
            </article>)}</div>}
        </section>}
      </div>
    </MainLayout>
  );
};
export default Workbench;
