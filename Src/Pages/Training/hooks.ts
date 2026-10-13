import { useCallback, useEffect, useState } from 'react';
import { TrainingParams, TrainingPhaseStatuses, TrainingStepStatus } from './types';
import { TrainingWorkflowStatus } from './Services/trainingResponses';
import { getWorkbenchHistory, getWorkbenchStatus, startWorkbenchTraining, stopWorkbenchTraining } from './Services/trainingApi';
import { TRAINING_PHASES } from './constants';

const STORAGE_KEY = 'trainingWorkbenchActiveRun';
const STAGE_PHASES: Record<string, string> = {
  audio_slice: 'phase1', asr_recognition: 'phase2', text_processing: 'phase3',
  audio_features: 'phase4', semantic_encoding: 'phase5',
};
const terminal = (status: string) => ['completed', 'failed', 'stopped', 'interrupted'].includes(status);

export const useTrainingWorkbench = (params: TrainingParams, files: File[]) => {
  const [workflow, setWorkflow] = useState<TrainingWorkflowStatus | null>(null);
  const [history, setHistory] = useState<TrainingWorkflowStatus[]>([]);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refreshHistory = useCallback(async () => {
    try { setHistory((await getWorkbenchHistory()).runs); }
    catch (err) { setError(err instanceof Error ? err.message : '读取训练历史失败'); }
  }, []);
  useEffect(() => { void refreshHistory(); }, [refreshHistory]);
  useEffect(() => {
    if (!selectedId) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await getWorkbenchStatus(selectedId);
        if (disposed) return;
        setWorkflow(result); setError(null);
        if (!terminal(result.status)) timer = setTimeout(poll, 3000);
        else void refreshHistory();
      } catch (err) {
        if (disposed) return;
        setError(err instanceof Error ? err.message : '查询训练状态失败');
        timer = setTimeout(poll, 5000);
      }
    };
    void poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, [selectedId, refreshHistory]);
  const selectRun = useCallback((run: TrainingWorkflowStatus) => {
    localStorage.setItem(STORAGE_KEY, run.workflow_id);
    setSelectedId(run.workflow_id); setWorkflow(run);
  }, []);
  const start = async (target: 'selected' | 'gpt' | 'sovits' = 'selected') => {
    setIsSubmitting(true); setError(null);
    try {
      const result = await startWorkbenchTraining(params, files, target);
      selectRun(result.training_workflow); void refreshHistory(); return true;
    } catch (err) { setError(err instanceof Error ? err.message : '启动训练失败'); return false; }
    finally { setIsSubmitting(false); }
  };
  const stop = async () => {
    if (!workflow) return;
    try { setWorkflow(await stopWorkbenchTraining(workflow.workflow_id)); }
    catch (err) { setError(err instanceof Error ? err.message : '停止训练失败'); }
  };
  const phaseStatuses: TrainingPhaseStatuses = Object.fromEntries(TRAINING_PHASES.map(p => [p.id, 'pending']));
  if (workflow) {
    for (const [stage, status] of Object.entries(workflow.preprocessing || {})) {
      if (STAGE_PHASES[stage]) phaseStatuses[STAGE_PHASES[stage]] = status as TrainingPhaseStatuses[string];
    }
    phaseStatuses.phase6 = 'skipped'; phaseStatuses.phase7 = 'skipped';
    for (const target of workflow.targets) phaseStatuses[target.target === 'gpt' ? 'phase7' : 'phase6'] =
      workflow.status === 'queued' && target.status === 'pending' ? 'queued' : target.status;
  }
  const getSubStepStatus = (phase: number, substep: number): TrainingStepStatus => {
    const status = phaseStatuses[TRAINING_PHASES[phase].id];
    if (status === 'completed') return 'completed';
    if (status === 'skipped') return 'skipped';
    if (status === 'failed') return 'error';
    if (status === 'stopped') return 'stopped';
    if (status === 'running') return substep === 0 ? 'completed' : substep === 1 ? 'processing' : 'pending';
    if (status === 'starting') return 'starting';
    return 'pending';
  };
  const isTraining = isSubmitting || Boolean(workflow && !terminal(workflow.status));
  const currentMessage = workflow?.stop_requested && isTraining ? '正在停止；预处理阶段会等待当前步骤结束'
    : workflow?.error || (workflow ? `${workflow.project_name} / ${workflow.version} · ${workflow.status === 'completed' ? '训练完成' : workflow.phase === 'preprocessing' ? '正在准备数据' : workflow.current_target ? `正在训练 ${workflow.current_target.toUpperCase()}` : workflow.status === 'queued' ? '等待 GPU' : workflow.status}` : '请选择角色和训练数据');
  return { workflow, history, error, isTraining, isSubmitting, currentMessage, phaseStatuses, getSubStepStatus, start, stop, selectRun, refreshHistory };
};
