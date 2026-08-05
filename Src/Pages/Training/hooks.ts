import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getTrainingStatus,
  getTrainingWorkflowStatus,
  startFullTraining,
  startGptTraining,
  startSovitsTraining,
  stopTrainingJob,
  stopTrainingWorkflow,
} from './Services/trainingApi';
import { GatewayWorkflowStep, TrainingWorkflowStatus } from './Services/trainingResponses';
import { FullTrainingRequest, StartGptTrainingRequest, StartSovitsTrainingRequest } from './Services/trainingRequests';
import { TrainingParams, TrainingPhaseStatuses, TrainingStepStatus } from './types';
import { TRAINING_PHASES } from './constants';
import { createLogger } from '../../../System/Log/logger';

const logger = createLogger('pages/training', 'hooks');

const STAGE_TO_PHASE_MAP: Record<string, number> = {
  audio_slice: 0,
  asr_recognition: 1,
  text_processing: 2,
  audio_features: 3,
  semantic_encoding: 4,
  sovits_training: 5,
  gpt_training: 6,
};

interface ActiveJob {
  jobId: string;
  type: 'gpt' | 'sovits';
  phaseIndex: number;
}

const TARGET_TO_PHASE_ID = {
  sovits: 'phase6',
  gpt: 'phase7',
} as const;

const createInitialPhaseStatuses = (): TrainingPhaseStatuses => Object.fromEntries(
  TRAINING_PHASES.map((phase) => [phase.id, 'pending']),
) as TrainingPhaseStatuses;

const normalizeStepName = (step: string): string => {
  const mapped: Record<string, string> = {
    audio_slice: 'audio_slice',
    asr_recognition: 'asr_recognition',
    text_processing: 'text_processing',
    audio_features: 'audio_features',
    semantic_encoding: 'semantic_encoding',
    sovits_training: 'sovits_training',
    gpt_training: 'gpt_training',
  };
  return mapped[step] || step;
};

const normalizePathSegment = (value: string): string =>
  value.trim().replace(/[\\/:*?"<>|]+/g, '_');

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

export const useTrainingSimulation = (params?: TrainingParams, audioFiles: File[] = []) => {
  const [isTraining, setIsTraining] = useState(false);
  const [phaseStatuses, setPhaseStatuses] = useState<TrainingPhaseStatuses>(createInitialPhaseStatuses);
  const [error, setError] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');

  const activeJobsRef = useRef<ActiveJob[]>([]);
  const activeWorkflowIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  const completedPhases = TRAINING_PHASES
    .filter((phase) => phaseStatuses[phase.id] === 'completed')
    .map((phase) => phase.id);

  const getSubStepStatus = useCallback((phaseIndex: number, subStepIndex: number): TrainingStepStatus => {
    const phaseId = TRAINING_PHASES[phaseIndex]?.id;
    const status = phaseId ? phaseStatuses[phaseId] : 'pending';
    if (status === 'completed') return 'completed';
    if (status === 'failed') return subStepIndex === 1 ? 'error' : subStepIndex === 0 ? 'completed' : 'pending';
    if (status === 'stopped') return subStepIndex === 1 ? 'stopped' : subStepIndex === 0 ? 'completed' : 'pending';
    if (status === 'skipped') return 'skipped';
    if (status === 'running') return subStepIndex === 0 ? 'completed' : subStepIndex === 1 ? 'processing' : 'pending';
    if (status === 'starting') return subStepIndex === 0 ? 'processing' : 'pending';
    return 'pending';
  }, [phaseStatuses]);

  const clearPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const markPhaseCompleted = useCallback((phaseIndex: number) => {
    const phaseId = TRAINING_PHASES[phaseIndex]?.id;
    if (!phaseId) {
      return;
    }
    setPhaseStatuses((prev) => ({ ...prev, [phaseId]: 'completed' }));
  }, []);

  const applyWorkflowSteps = useCallback((steps: GatewayWorkflowStep[]) => {
    for (const step of steps) {
      const normalized = normalizeStepName(step.step);
      const phaseIndex = STAGE_TO_PHASE_MAP[normalized];
      if (phaseIndex === undefined) {
        continue;
      }
      markPhaseCompleted(phaseIndex);
    }
  }, [markPhaseCompleted]);

  const schedulePoll = useCallback((fn: () => void, delayMs: number) => {
    clearPolling();
    pollTimerRef.current = window.setTimeout(fn, delayMs);
  }, [clearPolling]);

  const pollTrainingStatuses = useCallback(async () => {
    if (stoppedRef.current) {
      return;
    }

    if (activeJobsRef.current.length === 0) {
      setIsTraining(false);
      setCurrentMessage('训练任务已全部结束');
      return;
    }

    try {
      const results = await Promise.all(activeJobsRef.current.map(async (job) => ({
        job,
        status: await getTrainingStatus(job.jobId),
      })));

      let hasRunning = false;
      let firstError: string | null = null;
      const remainingJobs: ActiveJob[] = [];

      for (const { job, status } of results) {
        const payload = status.status;
        const phaseIndex = job.phaseIndex;

        if (payload.status === 'running') {
          hasRunning = true;
          remainingJobs.push(job);
          setPhaseStatuses((prev) => ({ ...prev, [TRAINING_PHASES[phaseIndex].id]: 'running' }));
          setCurrentMessage(`${job.type.toUpperCase()} 训练中: ${payload.job_id}`);
          continue;
        }

        if (payload.status === 'completed') {
          markPhaseCompleted(phaseIndex);
          setCurrentMessage(`${job.type.toUpperCase()} 训练完成`);
          continue;
        }

        if (payload.status === 'failed' || payload.status === 'stopped') {
          firstError = payload.error_message || `${job.type.toUpperCase()} 训练失败`;
          setPhaseStatuses((prev) => ({
            ...prev,
            [TRAINING_PHASES[phaseIndex].id]: payload.status === 'stopped' ? 'stopped' : 'failed',
          }));
          break;
        }
      }

      activeJobsRef.current = remainingJobs;

      if (firstError) {
        setError(firstError);
        setIsTraining(false);
        clearPolling();
        return;
      }

      if (hasRunning) {
        schedulePoll(() => {
          void pollTrainingStatuses();
        }, 3000);
        return;
      }

      setIsTraining(false);
      setCurrentMessage('训练已全部完成');
    } catch (pollError) {
      const message = pollError instanceof Error ? pollError.message : '查询训练状态失败';
      setError(message);
      setIsTraining(false);
      clearPolling();
    }
  }, [clearPolling, markPhaseCompleted, schedulePoll]);

  const applyTrainingWorkflowStatus = useCallback((workflow: TrainingWorkflowStatus) => {
    setPhaseStatuses((prev) => {
      const next = { ...prev };
      for (const target of workflow.targets) {
        next[TARGET_TO_PHASE_ID[target.target]] = target.status === 'pending' && workflow.status === 'queued'
          ? 'queued'
          : target.status;
      }
      return next;
    });

    if (workflow.status === 'queued') {
      setIsTraining(true);
      setCurrentMessage(`训练工作流排队中: ${workflow.workflow_id}`);
      return;
    }

    if (workflow.status === 'running') {
      setIsTraining(true);
      const target = workflow.targets.find((item) => item.target === workflow.current_target);
      const jobText = target?.job_id ? `: ${target.job_id}` : '';
      setCurrentMessage(`${workflow.current_target?.toUpperCase() || '训练'} 进行中${jobText}`);
      return;
    }

    setIsTraining(false);
    if (workflow.status === 'completed') {
      setCurrentMessage('训练已全部完成');
      setError(null);
    } else if (workflow.status === 'stopped') {
      setCurrentMessage('训练工作流已停止');
    } else {
      const failedTarget = workflow.targets.find((target) => target.status === 'failed');
      const message = failedTarget?.error || workflow.error || '训练工作流失败';
      setCurrentMessage(message);
      setError(message);
    }
  }, []);

  const pollTrainingWorkflow = useCallback(async () => {
    if (stoppedRef.current || !activeWorkflowIdRef.current) {
      return;
    }

    try {
      const workflow = await getTrainingWorkflowStatus(activeWorkflowIdRef.current);
      applyTrainingWorkflowStatus(workflow);
      if (workflow.status === 'queued' || workflow.status === 'running') {
        schedulePoll(() => {
          void pollTrainingWorkflow();
        }, 3000);
      } else {
        activeWorkflowIdRef.current = null;
      }
    } catch (pollError) {
      const message = pollError instanceof Error ? pollError.message : '查询训练工作流状态失败';
      setError(message);
      setIsTraining(false);
      clearPolling();
    }
  }, [applyTrainingWorkflowStatus, clearPolling, schedulePoll]);

  const startTraining = useCallback(async () => {
    if (!params) {
      setError('训练参数未设置');
      return;
    }

    const roleName = (params.characterName || '').trim();
    const derivedPaths = buildDerivedTrainingPaths(
      params.worldName || '',
      roleName,
      params.version,
    );
    const inputAudioDir = (params.inputAudioDir || '').trim() || derivedPaths?.inputAudioDir || '';
    const listFile = (params.listFile || '').trim();
    const outputDir = (params.outputDir || '').trim() || derivedPaths?.outputDir || '';
    if (!params.worldName?.trim()) {
      setError('所属世界不能为空');
      return;
    }
    if (!roleName) {
      setError('角色名不能为空');
      return;
    }
    if (!params.version.trim()) {
      setError('模型版本不能为空');
      return;
    }
    if (!inputAudioDir) {
      setError(params.preprocessingMode === 'existing' ? '切分音频目录不能为空' : '输入音频目录不能为空');
      return;
    }
    if (params.preprocessingMode === 'existing' && !listFile) {
      setError('标注文件不能为空');
      return;
    }
    if (!outputDir) {
      setError('输出根目录不能为空');
      return;
    }
    if (!params.trainGpt && !params.trainSovits) {
      setError('至少启用一个训练目标');
      return;
    }

    stoppedRef.current = false;
    activeJobsRef.current = [];
    activeWorkflowIdRef.current = null;
    setIsTraining(true);
    const initialStatuses = createInitialPhaseStatuses();
    if (!params.trainSovits) initialStatuses.phase6 = 'skipped';
    if (!params.trainGpt) initialStatuses.phase7 = 'skipped';
    setPhaseStatuses(initialStatuses);
    setError(null);
    setCurrentMessage('准备启动训练引导...');

    try {
      const requestParams: FullTrainingRequest = {
        project_name: roleName,
        input_audio_dir: inputAudioDir,
        output_dir: outputDir,
        language: params.language,
        version: params.version,
        world_name: params.worldName.trim(),
        preprocessing_mode: params.preprocessingMode,
        list_file: listFile,
        train_gpt: params.trainGpt,
        train_sovits: params.trainSovits,
        gpt_batch_size: params.gptBatchSize,
        gpt_total_epoch: params.gptEpoch,
        sovits_batch_size: params.sovitsBatchSize,
        sovits_total_epoch: params.sovitsEpoch,
        training_order: params.trainingOrder,
        audio_files: audioFiles,
      };

      const workflowResult = await startFullTraining(requestParams);
      applyWorkflowSteps(workflowResult.preprocess_steps || []);
      const workflow = workflowResult.training_workflow;
      if (!workflow?.workflow_id) {
        throw new Error('完整训练响应未返回 workflow_id');
      }

      activeWorkflowIdRef.current = workflow.workflow_id;
      applyTrainingWorkflowStatus(workflow);
      await pollTrainingWorkflow();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '启动训练失败';
      setError(errorMessage);
      setIsTraining(false);
      logger.error('启动训练失败', { error: err });
    }
  }, [applyTrainingWorkflowStatus, applyWorkflowSteps, audioFiles, params, pollTrainingWorkflow]);

  const startSingleTraining = useCallback(async (target: 'gpt' | 'sovits') => {
    if (!params) {
      setError('训练参数未设置');
      return;
    }

    const roleName = (params.characterName || '').trim();
    if (!params.worldName?.trim()) {
      setError('所属世界不能为空');
      return;
    }
    if (!roleName) {
      setError('角色名不能为空');
      return;
    }
    if (!params.outputDir.trim()) {
      setError('输出根目录不能为空');
      return;
    }
    if (target === 'sovits' && !params.version.trim()) {
      setError('模型版本不能为空');
      return;
    }

    stoppedRef.current = false;
    activeJobsRef.current = [];
    activeWorkflowIdRef.current = null;
    setIsTraining(true);
    setError(null);
    setCurrentMessage(`准备启动${target === 'gpt' ? 'GPT' : 'SoVITS'}训练...`);
    setPhaseStatuses(createInitialPhaseStatuses());

    try {
      const expRoot = params.outputDir.trim();
      let job: ActiveJob | null = null;

      if (target === 'gpt') {
        const requestParams: StartGptTrainingRequest = {
          exp_name: roleName,
          exp_root: expRoot,
          batch_size: params.gptBatchSize,
          total_epoch: params.gptEpoch,
        };
        const result = await startGptTraining(requestParams);
        if (!result.job_id) {
          throw new Error(result.message || 'GPT训练未返回任务ID');
        }
        job = { jobId: result.job_id, type: 'gpt', phaseIndex: 6 };
      } else {
        const requestParams: StartSovitsTrainingRequest = {
          exp_name: roleName,
          exp_root: expRoot,
          version: params.version,
          batch_size: params.sovitsBatchSize,
          total_epoch: params.sovitsEpoch,
        };
        const result = await startSovitsTraining(requestParams);
        if (!result.job_id) {
          throw new Error(result.message || 'SoVITS训练未返回任务ID');
        }
        job = { jobId: result.job_id, type: 'sovits', phaseIndex: 5 };
      }

      if (job) {
        setPhaseStatuses((prev) => ({ ...prev, [TRAINING_PHASES[job.phaseIndex].id]: 'starting' }));
      }
      activeJobsRef.current = job ? [job] : [];
      await pollTrainingStatuses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '单独训练启动失败';
      setError(errorMessage);
      setIsTraining(false);
      logger.error('单独训练启动失败', { error: err, target });
    }
  }, [params, pollTrainingStatuses]);

  const handleStopTraining = useCallback(async () => {
    try {
      stoppedRef.current = true;
      clearPolling();
      const workflowId = activeWorkflowIdRef.current;
      const jobs = [...activeJobsRef.current];

      if (workflowId) {
        const workflow = await stopTrainingWorkflow(workflowId);
        applyTrainingWorkflowStatus(workflow);
        activeWorkflowIdRef.current = null;
      } else {
        const results = await Promise.allSettled(jobs.map((job) => stopTrainingJob(job.jobId)));
        const rejected = results.find((result) => result.status === 'rejected');
        if (rejected?.status === 'rejected') {
          throw rejected.reason;
        }
        activeJobsRef.current = [];
        setPhaseStatuses((prev) => {
          const next = { ...prev };
          for (const job of jobs) next[TRAINING_PHASES[job.phaseIndex].id] = 'stopped';
          return next;
        });
      }

      setIsTraining(false);
      setCurrentMessage('训练停止请求已发送');
      logger.info('训练停止请求已发送', { workflowId, jobs: jobs.map((job) => job.jobId) });
    } catch (err) {
      stoppedRef.current = false;
      const errorMessage = err instanceof Error ? err.message : '停止训练失败';
      setError(errorMessage);
      logger.error('停止训练失败', { error: err });
      if (activeWorkflowIdRef.current) {
        void pollTrainingWorkflow();
      } else if (activeJobsRef.current.length > 0) {
        void pollTrainingStatuses();
      }
    }
  }, [applyTrainingWorkflowStatus, clearPolling, pollTrainingStatuses, pollTrainingWorkflow]);

  const toggleTraining = useCallback(() => {
    if (isTraining) {
      void handleStopTraining();
    } else {
      setError(null);
      setCurrentMessage('');
      setPhaseStatuses(createInitialPhaseStatuses());
      void startTraining();
    }
  }, [handleStopTraining, isTraining, startTraining]);

  useEffect(() => () => {
    stoppedRef.current = true;
    clearPolling();
  }, [clearPolling]);

  return {
    isTraining,
    phaseStatuses,
    completedPhases,
    error,
    currentMessage,
    toggleTraining,
    startGptOnly: () => void startSingleTraining('gpt'),
    startSovitsOnly: () => void startSingleTraining('sovits'),
    getSubStepStatus,
  };
};
