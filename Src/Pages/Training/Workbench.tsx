import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Database, FolderOpen, History, Layers, Play, Square, Upload } from 'lucide-react';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import CustomSelect from '../Emotion/Components/CustomSelect';
import { AppView } from '../../types';
import { TrainingParams } from './types';
import { useTrainingWorkbench } from './hooks';
import { getRoleWorkspaces, getTrainingVersions, getWorkbenchWorkspaces, getWorlds, RoleWorkspaceInfo, selectLocalDirectory, selectLocalFile, WorkbenchWorkspaceResponse, WorldInfo } from './Services/trainingApi';
import { TrainingWorkflowStatus } from './Services/trainingResponses';
import TrainingParamsSection from './Components/TrainingParamsSection';
import TrainingMonitor from './Components/TrainingMonitor';
import TrainingRunDetails from './Components/TrainingRunDetails';
import './training-workbench.css';

const defaults = (version: string) => ({ sovitsBatchSize: 4, sovitsEpoch: version.startsWith('v5') ? 12 : 8, gptBatchSize: version.startsWith('v5') ? 8 : 4, gptEpoch: version.startsWith('v5') ? 20 : 15 });
const initial: TrainingParams = {
  roleMode: 'existing', version: 'v5turbo', language: 'zh', worldName: '', characterName: '',
  preprocessingMode: 'cached', trainingMode: 'fresh', sourceVersion: '', sourceWorkspace: '', resumeWorkspace: '',
  inputAudioDir: '', listFile: '', outputDir: '', trainSovits: true, trainGpt: true, trainingOrder: 'sovits_first',
  gpuNumbers: '0', gptLearningRate: 0.01, sovitsLearningRate: 0.0001, saveEveryEpoch: 1, logInterval: 10,
  loraRank: 32, gradCheckpoint: true, fp16: true, ...defaults('v5turbo'),
};
const emptyWorkspace: WorkbenchWorkspaceResponse = { versions: [], resume_choices: [] };
const statusNames: Record<string, string> = { queued: '排队中', running: '进行中', completed: '已完成', failed: '失败', stopped: '已停止', interrupted: '监控中断' };
const isAudio = (file: File) => file.type.startsWith('audio/') || /\.(wav|mp3|flac|m4a|ogg|aac|opus|wma)$/i.test(file.name);

const Workbench: React.FC = () => {
  const [params, setParams] = useState<TrainingParams>(initial);
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
  useEffect(() => { directoryInput.current?.setAttribute('webkitdirectory', ''); }, [params.preprocessingMode]);
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
  const inputClass = 'theme-input w-full rounded-xl px-4 py-3 text-sm disabled:opacity-50';
  const cardClass = 'theme-section rounded-xl p-5';
  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setParams(previous => ({ ...previous, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value }));
  };
  const field = (name: keyof TrainingParams, label: string, type = 'text', step?: string) => (
    <label className="flex flex-col gap-2 text-sm font-bold" key={name}>
      <span className="theme-subtitle">{label}</span>
      <input name={name} aria-label={label} value={String(params[name] ?? '')} type={type} step={step} min={type === 'number' ? (step && Number(step) < 1 ? step : '1') : undefined} disabled={busy} onChange={change} className={inputClass} />
    </label>
  );
  const setVersion = (version: string) => setParams(previous => ({ ...previous, version, resumeWorkspace: '', ...defaults(version) }));
  const setRoleMode = (roleMode: 'existing' | 'new') => {
    setFiles([]);
    setParams(previous => ({ ...previous, roleMode, characterName: '', preprocessingMode: roleMode === 'existing' ? 'cached' : 'full', trainingMode: 'fresh', resumeWorkspace: '', sourceVersion: '', sourceWorkspace: '' }));
  };
  const reason = !params.worldName ? '请选择所属世界' : !params.characterName.trim() ? '请选择或填写角色名' : !params.version ? '请选择模型版本'
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
      gptEpoch: (options.gpt_total_epoch || 20) + 1, sovitsEpoch: (options.sovits_total_epoch || 12) + 1,
      loraRank: options.lora_rank || 32, gpuNumbers: options.gpu_numbers || '0',
      sourceVersion: options.source_version || run.version, sourceWorkspace: options.source_workspace || run.project_root });
    setPanel('prepare');
  };
  const canStart = !busy && !reason;
  return (
    <MainLayout title="训练工作台" subtitle="准备数据、训练模型、查看日志与试听。" currentView={AppView.TRAINING} hideHeader contentClassName="min-h-0">
      <div className="training-workbench pb-5">
        <div className="flex flex-wrap gap-2 px-2">
          {([{ id: 'prepare', label: '训练准备', Icon: Layers }, { id: 'monitor', label: '训练监控与试听', Icon: Activity }, { id: 'history', label: '训练历史', Icon: History }] as const).map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setPanel(id)} className={`training-tab rounded-t-2xl border border-b-0 px-5 py-4 text-sm font-black ${panel === id ? 'training-tab-active' : ''}`}><Icon className="mr-2 inline h-4 w-4" />{label}</button>
          ))}
        </div>
        <section className="training-page-surface rounded-2xl border p-4 lg:p-5">
          {(pageError || training.error) && <div role="alert" className="theme-status-block-danger mb-4 rounded-xl p-4 text-sm">{pageError || training.error}</div>}
          {panel === 'prepare' && <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <section className={cardClass}>
                <h3 className="theme-title mb-4 text-lg font-black">训练对象</h3>
                <div className="mb-4 flex gap-2">
                  <button disabled={busy} onClick={() => setRoleMode('existing')} className={`rounded-xl border px-4 py-3 text-sm font-bold ${params.roleMode === 'existing' ? 'theme-nav-item-active' : 'theme-section-soft'}`}>已有角色 / 新增版本或复训</button>
                  <button disabled={busy} onClick={() => setRoleMode('new')} className={`rounded-xl border px-4 py-3 text-sm font-bold ${params.roleMode === 'new' ? 'theme-nav-item-active' : 'theme-section-soft'}`}>创建新角色</button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <CustomSelect label="所属世界" value={params.worldName || ''} options={worlds.map(w => ({ id: w.name, name: w.name }))} disabled={busy} onChange={worldName => { setFiles([]); setParams(previous => ({ ...previous, worldName, characterName: '', sourceVersion: '', sourceWorkspace: '', resumeWorkspace: '' })); }} placeholder="选择世界" variant="filled" />
                  <CustomSelect label="模型版本" value={params.version} options={versions.map(v => ({ id: v, name: v }))} disabled={busy} onChange={setVersion} variant="filled" />
                  {params.roleMode === 'existing' ? <CustomSelect label="已有角色" value={params.characterName} options={[...new Set([...roles, ...(params.characterName ? [params.characterName] : [])])].map(name => ({ id: name, name }))} disabled={busy || !params.worldName} onChange={characterName => setParams(previous => ({ ...previous, characterName, sourceVersion: '', sourceWorkspace: '', resumeWorkspace: '' }))} placeholder="选择角色" variant="filled" /> : field('characterName', '新角色名称')}
                  {field('gpuNumbers', 'GPU 编号（如 0 或 0,1）')}
                </div>
                {duplicate && <p className="mt-3 text-sm text-red-600">角色已存在，使用已有角色可以新增模型版本。</p>}
                {params.version.startsWith('v5') && <p className="theme-subtitle mt-4 text-sm">V5 使用对应的 Dev / Turbo 底模及 LoRA；GPT 默认底模为 s1v3。预设：SoVITS 12 轮，GPT 20 轮。</p>}
              </section>
              <section className={cardClass}>
                <h3 className="theme-title mb-4 text-lg font-black">训练方式</h3>
                <label className="mb-4 block text-sm font-bold">起点
                  <select aria-label="训练起点" name="trainingMode" value={params.trainingMode} onChange={change} disabled={busy} className={`${inputClass} mt-2`}>
                    <option value="fresh">从官方底模重新训练</option><option value="resume">从已有训练 checkpoint 续训</option>
                  </select>
                </label>
                {params.trainingMode === 'resume' ? <>
                  <label className="block text-sm font-bold">续训记录
                    <select aria-label="续训记录" name="resumeWorkspace" value={params.resumeWorkspace} onChange={e => { const choice = resumeChoices.find(c => c.workspace === e.target.value); setParams(previous => ({ ...previous, resumeWorkspace: e.target.value, loraRank: choice?.lora_ranks.find(rank => rank > 0) || previous.loraRank })); }} disabled={busy} className={`${inputClass} mt-2`}>
                      <option value="">请选择含训练 checkpoint 的目录</option>{resumeChoices.map(choice => <option key={choice.workspace} value={choice.workspace}>{choice.label} · {choice.gpt ? 'GPT ' : ''}{choice.sovits ? 'SoVITS' : ''}</option>)}
                    </select>
                  </label>
                  <p className="theme-subtitle mt-3 text-sm">轮数是累计目标，例如已经训练 12 轮，继续到 16 轮请填写 16。LoRA rank 必须与 checkpoint 一致。</p>
                </> : <p className="theme-subtitle text-sm leading-6">每次重训会创建独立目录，从第 1 轮开始。完成后发布新权重，历史权重保留。</p>}
                <div className="mt-4 flex gap-5 text-sm font-bold">
                  <label><input name="trainSovits" type="checkbox" checked={params.trainSovits} onChange={change} disabled={busy} className="mr-2" />训练 SoVITS</label>
                  <label><input name="trainGpt" type="checkbox" checked={params.trainGpt} onChange={change} disabled={busy} className="mr-2" />训练 GPT</label>
                </div>
                <label className="mt-4 block text-sm font-bold">训练顺序
                  <select name="trainingOrder" value={params.trainingOrder} onChange={change} disabled={busy} className={`${inputClass} mt-2`}><option value="sovits_first">先 SoVITS，后 GPT</option><option value="gpt_first">先 GPT，后 SoVITS</option></select>
                </label>
              </section>
            </div>
            {params.trainingMode === 'fresh' && <section className={cardClass}>
              <h3 className="theme-title mb-4 flex items-center gap-2 text-lg font-black"><Database className="h-5 w-5" />训练数据</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-bold">数据方式
                  <select aria-label="数据方式" name="preprocessingMode" value={params.preprocessingMode} onChange={change} disabled={busy} className={`${inputClass} mt-2`}>
                    <option value="full">原始音频：切分、ASR、提取特征</option><option value="existing">已有切分音频和 .list 标注</option><option value="cached" disabled={params.roleMode === 'new'}>复用已有特征数据</option>
                  </select>
                </label>
                <label className="text-sm font-bold">标注语言
                  <select name="language" value={params.language} onChange={change} disabled={busy} className={`${inputClass} mt-2`}>{[['zh', '中文'], ['yue', '粤语'], ['en', '英语'], ['ja', '日语'], ['ko', '韩语'], ['auto', '自动识别']].map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select>
                </label>
              </div>
              {params.preprocessingMode === 'cached' ? <div className="mt-4">
                <label className="text-sm font-bold">特征来源版本
                  <select aria-label="特征来源版本" value={params.sourceVersion} disabled={busy || dataLoading} onChange={e => { const entry = data.versions.find(v => v.version === e.target.value); setParams(previous => ({ ...previous, sourceVersion: e.target.value, sourceWorkspace: entry?.workspace || '' })); }} className={`${inputClass} mt-2`}>
                    <option value="">请选择数据来源</option>{data.versions.filter(v => v.has_features).map(v => <option key={v.version} value={v.version}>{v.version} · {v.text_lines} 段标注</option>)}
                  </select>
                </label>
                <p className="theme-subtitle mt-3 text-sm">复用 BERT、HuBERT 和音频特征；切换底模版本时重新提取语义 token。</p>
                {params.sourceWorkspace && <p className="theme-kicker mt-2 break-all font-mono text-xs">{params.sourceWorkspace}</p>}
              </div> : <div className="mt-4 space-y-4">
                {params.preprocessingMode === 'full' && <div className={`rounded-xl border-2 border-dashed p-5 ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}`} onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!busy) setFiles(Array.from(e.dataTransfer.files).filter(isAudio)); }}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Upload className="h-5 w-5" /><span className="text-sm font-bold">拖入音频，或选择文件 / 文件夹</span>
                    <button disabled={busy} className="theme-section-soft rounded-lg border px-3 py-2 text-sm" onClick={() => fileInput.current?.click()}>选择音频</button>
                    <button disabled={busy} className="theme-section-soft rounded-lg border px-3 py-2 text-sm" onClick={() => directoryInput.current?.click()}>选择文件夹</button>
                    <input ref={fileInput} type="file" accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg,.aac" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files || []).filter(isAudio))} />
                    <input ref={directoryInput} type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files || []).filter(isAudio))} />
                  </div>
                  {files.length > 0 && <div className="mt-4"><div className="mb-3 flex justify-between text-sm"><span>已选择 {files.length} 个音频 · 首个：{files[0].name}</span><button disabled={busy} onClick={() => setFiles([])} className="text-red-600">清空</button></div><audio controls src={sourceAudio} className="w-full" /></div>}
                </div>}
                <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
                  {field('inputAudioDir', params.preprocessingMode === 'existing' ? '服务器上的切分音频目录' : '服务器上的原始音频目录（上传时可留空）')}
                  <button disabled={busy} onClick={() => void chooseServerPath('inputAudioDir')} className="theme-section-soft rounded-xl border px-4 py-3 text-sm"><FolderOpen className="mr-2 inline h-4 w-4" />选择服务器目录</button>
                  {params.preprocessingMode === 'existing' && <>{field('listFile', '.list 标注文件路径')}<button disabled={busy} onClick={() => void chooseServerPath('listFile')} className="theme-section-soft rounded-xl border px-4 py-3 text-sm">选择 .list 文件</button></>}
                </div>
              </div>}
            </section>}
            <section className={cardClass}>
              <div className="mb-4 flex items-center justify-between"><h3 className="theme-title text-lg font-black">训练参数</h3><button disabled={busy} onClick={() => setParams(previous => ({ ...previous, ...defaults(previous.version) }))} className="theme-section-soft rounded-lg border px-3 py-2 text-sm">恢复版本预设</button></div>
              <TrainingParamsSection params={params} isTraining={busy} onChange={change} />
              <details className="mt-4"><summary className="cursor-pointer text-sm font-bold">高级参数</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {field('sovitsLearningRate', 'SoVITS 学习率', 'number', '0.00001')}{field('gptLearningRate', 'GPT 学习率', 'number', '0.001')}
                  {field('saveEveryEpoch', '每隔几轮保存', 'number')}{params.version.startsWith('v5') || ['v3', 'v4'].includes(params.version) ? field('loraRank', 'LoRA rank', 'number') : null}
                  {field('logInterval', 'SoVITS 每隔几步记录 Loss', 'number')}
                </div>
                <div className="mt-4 flex flex-wrap gap-5 text-sm"><label><input name="gradCheckpoint" type="checkbox" checked={params.gradCheckpoint} onChange={change} disabled={busy} className="mr-2" />梯度检查点（节省显存）</label><label><input name="fp16" type="checkbox" checked={params.fp16} onChange={change} disabled={busy} className="mr-2" />混合精度</label></div>
              </details>
            </section>
            <section className={`${cardClass} flex flex-col gap-3`}>
              {busy ? <button disabled={training.isSubmitting || training.workflow?.stop_requested} onClick={() => void training.stop()} className="theme-status-block-warning rounded-xl px-5 py-4 font-bold"><Square className="mr-2 inline h-4 w-4" />停止当前训练</button> : <>
                <button disabled={!canStart || (!params.trainGpt && !params.trainSovits)} title={reason} onClick={() => void start('selected')} className={`${canStart && (params.trainGpt || params.trainSovits) ? 'theme-button-amber' : 'theme-button-disabled'} rounded-xl px-5 py-4 font-bold`}><Play className="mr-2 inline h-4 w-4" />开始所选训练</button>
                <div className="grid gap-3 md:grid-cols-2"><button disabled={!canStart} onClick={() => void start('sovits')} className="theme-section-soft rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50">仅训练 SoVITS</button><button disabled={!canStart} onClick={() => void start('gpt')} className="theme-section-soft rounded-xl border px-4 py-3 text-sm font-bold disabled:opacity-50">仅训练 GPT</button></div>
                {reason && <p className="theme-subtitle text-sm">{reason}</p>}
              </>}
            </section>
          </div>}
          {panel === 'monitor' && <div className="space-y-4">
            {training.workflow && <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}><div><h3 className="font-black">{training.workflow.project_name} / {training.workflow.version}</h3><p className="theme-subtitle mt-1 text-sm">{training.currentMessage}</p><p className="theme-kicker mt-1 font-mono text-xs">{training.workflow.workflow_id}</p></div>{busy && <button disabled={training.workflow.stop_requested} onClick={() => void training.stop()} className="theme-status-block-warning rounded-xl px-4 py-3 text-sm font-bold">停止训练</button>}</div>}
            <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]"><div className={cardClass}><TrainingMonitor isTraining={busy} phaseStatuses={training.phaseStatuses} error={training.workflow?.error || training.error} currentMessage={training.currentMessage} getSubStepStatus={training.getSubStepStatus} /></div><TrainingRunDetails workflow={training.workflow} /></div>
          </div>}
          {panel === 'history' && <section className={cardClass}>
            <div className="mb-4 flex justify-between"><h3 className="text-lg font-black">训练历史</h3><button onClick={() => void training.refreshHistory()} className="theme-section-soft rounded-lg border px-3 py-2 text-sm">刷新</button></div>
            <p className="theme-subtitle mb-4 text-sm">这里保留由训练工作台启动的任务。已有脚本训练的 checkpoint 可在“续训记录”中选择。</p>
            {!training.history.length && <p className="theme-subtitle py-8 text-center">还没有工作台训练记录</p>}
            <div className="space-y-3">{training.history.map(run => <div key={run.workflow_id} data-run-id={run.workflow_id} className="theme-section-soft flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><div className="font-bold">{run.world_name} / {run.project_name} / {run.version} · {statusNames[run.status]}{run.options?.publish_models === false ? ' · 验证任务（未发布）' : ''}</div><div className="theme-subtitle mt-1 text-xs">{run.created_at?.replace('T', ' ').slice(0, 19)} · {run.order.map(t => t.toUpperCase()).join(' → ')}</div>{run.error && <p className="mt-2 max-w-2xl break-words text-xs text-red-600">{run.error}</p>}</div><div className="flex gap-2"><button onClick={() => { training.selectRun(run); setPanel('monitor'); }} className="theme-section rounded-lg border px-3 py-2 text-sm">查看日志 / 试听</button>{['completed', 'stopped', 'failed', 'interrupted'].includes(run.status) && <button onClick={() => resumeFromHistory(run)} className="theme-section rounded-lg border px-3 py-2 text-sm">配置续训</button>}</div></div>)}</div>
          </section>}
        </section>
      </div>
    </MainLayout>
  );
};
export default Workbench;
