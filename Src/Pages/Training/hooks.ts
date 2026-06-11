import { useState, useEffect, useCallback, useRef } from 'react';
import { getTrainingStatus, startFullTraining, startGptTraining, startSovitsTraining, stopTrainingJob } from './Services/trainingApi';
import { GatewayWorkflowStep } from './Services/trainingResponses';
import { FullTrainingRequest, StartGptTrainingRequest, StartSovitsTrainingRequest } from './Services/trainingRequests';
import { TrainingParams, TrainingStepStatus } from './types';
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
  const [activePhaseIndex, setActivePhaseIndex] = useState(-1);
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [activeSubStepIndex, setActiveSubStepIndex] = useState(-1);

  const activeJobsRef = useRef<ActiveJob[]>([]);
  const pollTimerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  const getSubStepStatus = useCallback((phaseIndex: number, subStepIndex: number): TrainingStepStatus => {
    if (phaseIndex < activePhaseIndex || completedPhases.includes(TRAINING_PHASES[phaseIndex]?.id)) {
      return 'completed';
    }
    if (phaseIndex === activePhaseIndex) {
      if (subStepIndex < activeSubStepIndex) {
        return 'completed';
      }
      if (subStepIndex === activeSubStepIndex) {
        return 'processing';
      }
    }
    return 'pending';
  }, [activePhaseIndex, activeSubStepIndex, completedPhases]);

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
    setCompletedPhases((prev) => (prev.includes(phaseId) ? prev : [...prev, phaseId]));
  }, []);

  const applyWorkflowSteps = useCallback((steps: GatewayWorkflowStep[]) => {
    let lastPhaseIndex = -1;
    for (const step of steps) {
      const normalized = normalizeStepName(step.step);
      const phaseIndex = STAGE_TO_PHASE_MAP[normalized];
      if (phaseIndex === undefined) {
        continue;
      }
      lastPhaseIndex = Math.max(lastPhaseIndex, phaseIndex);
      markPhaseCompleted(phaseIndex);
    }
    if (lastPhaseIndex >= 0) {
      setActivePhaseIndex(lastPhaseIndex);
      setActiveSubStepIndex(2);
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
      setActivePhaseIndex(-1);
      setActiveSubStepIndex(-1);
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
          setActivePhaseIndex(phaseIndex);
          setActiveSubStepIndex(1);
          setCurrentMessage(`${job.type.toUpperCase()} 训练中: ${payload.job_id}`);
          continue;
        }

        if (payload.status === 'completed') {
          markPhaseCompleted(phaseIndex);
          setActivePhaseIndex(phaseIndex);
          setActiveSubStepIndex(2);
          setCurrentMessage(`${job.type.toUpperCase()} 训练完成`);
          continue;
        }

        if (payload.status === 'failed' || payload.status === 'stopped') {
          firstError = payload.error_message || `${job.type.toUpperCase()} 训练失败`;
          setActivePhaseIndex(phaseIndex);
          setActiveSubStepIndex(1);
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
      setActivePhaseIndex(-1);
      setActiveSubStepIndex(-1);
      setCurrentMessage('训练已全部完成');
    } catch (pollError) {
      const message = pollError instanceof Error ? pollError.message : '查询训练状态失败';
      setError(message);
      setIsTraining(false);
      clearPolling();
    }
  }, [clearPolling, markPhaseCompleted, schedulePoll]);

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
    setIsTraining(true);
    setActivePhaseIndex(-1);
    setCompletedPhases([]);
    setActiveSubStepIndex(-1);
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

      const trainingJobs: ActiveJob[] = (workflowResult.training_steps || [])
        .map((step) => {
          const normalizedStep = normalizeStepName(step.step);
          const phaseIndex = STAGE_TO_PHASE_MAP[normalizedStep];
          const jobId = typeof step.result?.job_id === 'string' ? step.result.job_id : '';
          const type = normalizedStep === 'gpt_training' ? 'gpt' : normalizedStep === 'sovits_training' ? 'sovits' : null;
          if (!jobId || phaseIndex === undefined || !type) {
            return null;
          }
          return { jobId, type, phaseIndex } as ActiveJob;
        })
        .filter((item): item is ActiveJob => item !== null);

      if (trainingJobs.length === 0) {
        setIsTraining(false);
        setActivePhaseIndex(-1);
        setActiveSubStepIndex(-1);
        setCurrentMessage(workflowResult.message || '预处理完成，未启动训练任务');
        return;
      }

      activeJobsRef.current = trainingJobs;
      setCurrentMessage('预处理完成，正在启动训练监控...');
      await pollTrainingStatuses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '启动训练失败';
      setError(errorMessage);
      setIsTraining(false);
      logger.error('启动训练失败', { error: err });
    }
  }, [applyWorkflowSteps, audioFiles, params, pollTrainingStatuses]);

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
    setIsTraining(true);
    setError(null);
    setCurrentMessage(`准备启动${target === 'gpt' ? 'GPT' : 'SoVITS'}训练...`);
    setCompletedPhases([]);

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
        setActivePhaseIndex(6);
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
        setActivePhaseIndex(5);
      }

      setActiveSubStepIndex(0);
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
      const jobs = [...activeJobsRef.current];
      activeJobsRef.current = [];

      await Promise.allSettled(jobs.map((job) => stopTrainingJob(job.jobId)));

      setIsTraining(false);
      setActivePhaseIndex(-1);
      setActiveSubStepIndex(-1);
      setCurrentMessage('训练停止请求已发送');
      logger.info('训练停止请求已发送', { jobs: jobs.map((job) => job.jobId) });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '停止训练失败';
      setError(errorMessage);
      logger.error('停止训练失败', { error: err });
    }
  }, [clearPolling]);

  const toggleTraining = useCallback(() => {
    if (isTraining) {
      void handleStopTraining();
    } else {
      setError(null);
      setCurrentMessage('');
      setActivePhaseIndex(-1);
      setCompletedPhases([]);
      setActiveSubStepIndex(-1);
      void startTraining();
    }
  }, [handleStopTraining, isTraining, startTraining]);

  useEffect(() => () => {
    stoppedRef.current = true;
    clearPolling();
  }, [clearPolling]);

  return {
    isTraining,
    activePhaseIndex,
    completedPhases,
    error,
    currentMessage,
    activeSubStepIndex,
    toggleTraining,
    startGptOnly: () => void startSingleTraining('gpt'),
    startSovitsOnly: () => void startSingleTraining('sovits'),
    getSubStepStatus,
  };
};
