import React, { useEffect, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrainingWorkflowStatus } from '../Services/trainingResponses';
import { generateWorkbenchPreview, getWorkbenchLogs } from '../Services/trainingApi';

const TrainingRunDetails: React.FC<{ workflow: TrainingWorkflowStatus | null }> = ({ workflow }) => {
  const [targetName, setTargetName] = useState('sovits');
  const [logs, setLogs] = useState('');
  const [logError, setLogError] = useState('');
  const [text, setText] = useState('老师，早上好！今天也一起加油吧！');
  const [emotion, setEmotion] = useState('');
  const [seed, setSeed] = useState(2027);
  const [audioUrl, setAudioUrl] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const logRef = useRef<HTMLPreElement>(null);
  const audioRef = useRef('');
  const target = workflow?.targets.find(t => t.target === targetName);
  const telemetry = target?.telemetry;
  useEffect(() => {
    setTargetName(workflow?.targets[0]?.target || 'sovits');
    setEmotion(workflow?.preview?.emotions[0]?.name || '');
    setPreviewError(''); setAudioUrl('');
    if (audioRef.current) { URL.revokeObjectURL(audioRef.current); audioRef.current = ''; }
  }, [workflow?.workflow_id, workflow?.status]);
  useEffect(() => () => { if (audioRef.current) URL.revokeObjectURL(audioRef.current); }, []);
  useEffect(() => {
    setLogs(''); setLogError('');
    if (!workflow) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const result = await getWorkbenchLogs(workflow.workflow_id, targetName);
        if (disposed) return;
        const atBottom = !logRef.current || logRef.current.scrollHeight - logRef.current.scrollTop - logRef.current.clientHeight < 80;
        setLogs(result.text); setLogError('');
        if (atBottom) requestAnimationFrame(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; });
      } catch (err) { if (!disposed) setLogError(err instanceof Error ? err.message : '读取日志失败'); }
      if (!disposed && ['queued', 'running'].includes(workflow.status)) timer = setTimeout(load, 3000);
    };
    void load();
    return () => { disposed = true; clearTimeout(timer); };
  }, [workflow?.workflow_id, workflow?.status, targetName]);
  const synthesize = async () => {
    if (!workflow) return;
    setPreviewBusy(true); setPreviewError('');
    try {
      const result = await generateWorkbenchPreview(workflow.workflow_id, text, emotion, seed);
      if (!result.success || !result.audio_data) throw new Error('后端没有返回试听音频');
      const bytes = Uint8Array.from(atob(result.audio_data), c => c.charCodeAt(0));
      if (audioRef.current) URL.revokeObjectURL(audioRef.current);
      audioRef.current = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      setAudioUrl(audioRef.current);
    } catch (err) { setPreviewError(err instanceof Error ? err.message : '试听生成失败'); }
    finally { setPreviewBusy(false); }
  };
  if (!workflow) return <section className="theme-section rounded-xl p-5"><p className="theme-subtitle py-12 text-center">启动训练，或从训练历史选择任务，查看轮次、Loss 曲线、日志和试听。</p></section>;
  return <div className="min-w-0 space-y-4">
    <section className="theme-section rounded-xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-black">训练曲线与进度</h3><div className="flex gap-2">{workflow.targets.map(t => <button key={t.target} onClick={() => setTargetName(t.target)} className={`rounded-lg border px-3 py-2 text-sm font-bold ${targetName === t.target ? 'theme-nav-item-active' : 'theme-section-soft'}`}>{t.target.toUpperCase()}</button>)}</div></div>
      <div className="mb-4 grid grid-cols-3 gap-3 text-sm"><div className="theme-section-soft rounded-xl p-3"><div className="theme-subtitle">当前轮次 / 总轮数</div><div className="mt-1 text-xl font-black">{telemetry?.current_epoch ?? 0} / {telemetry?.total_epochs ?? workflow.options?.[`${targetName}_total_epoch`] ?? '—'}</div></div><div className="theme-section-soft rounded-xl p-3"><div className="theme-subtitle">最新训练 Loss</div><div className="mt-1 text-xl font-black">{telemetry?.current_loss != null ? telemetry.current_loss.toFixed(4) : '—'}</div></div><div className="theme-section-soft rounded-xl p-3"><div className="theme-subtitle">GPU 编号</div><div className="mt-1 text-xl font-black">{workflow.options?.gpu_numbers || '0'}</div></div></div>
      {telemetry?.loss_history.length ? <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={telemetry.loss_history}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="step" type="number" domain={['dataMin', 'dataMax']} /><YAxis domain={['auto', 'auto']} width={65} /><Tooltip formatter={(value: number) => [Number(value).toFixed(4), '训练 Loss']} labelFormatter={value => `Step ${value}`} /><Line type="linear" dataKey="value" stroke="#477dbc" strokeWidth={2} dot={telemetry.loss_history.length < 20} isAnimationActive={false} /></LineChart></ResponsiveContainer></div> : <p className="theme-subtitle flex h-48 items-center justify-center text-sm">等待训练器写入 Loss 数据</p>}
      <p className="theme-kicker mt-3 text-xs">横轴为训练 step；数据来自训练器的 TensorBoard 记录。{telemetry?.loss_tag ? ` 指标：${telemetry.loss_tag}` : ''}</p>
      {telemetry?.telemetry_error && <p className="mt-2 text-xs text-red-600">读取训练指标：{telemetry.telemetry_error}</p>}
      {target?.model && <p className="theme-subtitle mt-3 break-all font-mono text-xs">权重：{target.model}</p>}
    </section>
    <section className="theme-section rounded-xl p-5"><h3 className="mb-3 text-lg font-black">{targetName.toUpperCase()} 训练日志</h3>{logError && <p className="mb-2 text-sm text-red-600">{logError}</p>}<pre ref={logRef} className="max-h-80 overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-xs leading-5 text-slate-100 whitespace-pre-wrap break-words">{logs || '训练进程启动后将在这里显示日志。'}</pre></section>
    {workflow.status === 'completed' && <section className="theme-section rounded-xl p-5">
      <h3 className="mb-3 text-lg font-black">训练后试听</h3>
      <p className="theme-subtitle mb-4 text-sm">使用这次训练导出的权重。单独训练时，另一部分采用当前角色权重；没有角色权重时采用官方底模。</p>
      <label className="block text-sm font-bold">试听文本<textarea aria-label="试听文本" value={text} onChange={e => setText(e.target.value)} className="theme-input mt-2 min-h-24 w-full rounded-xl p-3" /></label>
      <div className="training-preview-fields mt-3"><label className="text-sm font-bold">参考情绪<select aria-label="参考情绪" value={emotion} onChange={e => setEmotion(e.target.value)} className="theme-input mt-2 w-full rounded-xl p-3"><option value="">请选择参考情绪</option>{workflow.preview?.emotions.map(e => <option value={e.name} key={e.name}>{e.name}</option>)}</select></label><label className="text-sm font-bold">随机种子<input aria-label="试听随机种子" value={seed} type="number" onChange={e => setSeed(Number(e.target.value))} className="theme-input mt-2 w-full rounded-xl p-3" /></label></div>
      {!workflow.preview?.emotions.length && <p className="mt-3 text-sm text-amber-700">没有 3–10 秒的可用参考音频，请在情感配置中添加参考音频。</p>}
      <button disabled={previewBusy || !text.trim() || !emotion} onClick={() => void synthesize()} className="theme-button-amber mt-4 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50">{previewBusy ? '正在合成…' : '生成试听'}</button>
      {previewError && <p role="alert" className="mt-3 text-sm text-red-600">{previewError}</p>}
      {audioUrl && <div className="mt-4 space-y-3"><audio controls src={audioUrl} className="w-full" /><a href={audioUrl} download={`${workflow.project_name}-${workflow.version}-试听.wav`} className="inline-block text-sm font-bold text-blue-700 underline">下载试听 WAV</a></div>}
    </section>}
  </div>;
};
export default TrainingRunDetails;
