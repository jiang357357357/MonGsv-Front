import React from 'react';
import { Check, Loader2, AlertCircle, Cpu } from 'lucide-react';
import { TRAINING_PHASES } from '../constants';
import { TrainingPhaseStatuses, TrainingStepStatus } from '../types';

interface TrainingMonitorProps {
  isTraining: boolean;
  phaseStatuses: TrainingPhaseStatuses;
  error: string | null;
  currentMessage: string;
  getSubStepStatus: (phaseIndex: number, subStepIndex: number) => TrainingStepStatus;
}

const TrainingMonitor: React.FC<TrainingMonitorProps> = ({
  isTraining,
  phaseStatuses,
  error,
  currentMessage,
  getSubStepStatus,
}) => {
  const completedCount = TRAINING_PHASES.filter((phase) => phaseStatuses[phase.id] === 'completed').length;
  const enabledCount = TRAINING_PHASES.filter((phase) => phaseStatuses[phase.id] !== 'skipped').length;
  const allFinished = enabledCount > 0 && completedCount === enabledCount;

  return (
    <div className="h-full flex flex-col">
      {/* 头部状态栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${isTraining ? 'theme-accent-text' : 'theme-kicker'}`} />
          <span className="theme-subtitle text-xs font-bold">
            {isTraining ? '训练进行中' : error ? '训练出错' : '等待开始'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <span className="theme-kicker text-[10px]">
              完成: {completedCount}/{enabledCount}
            </span>
          )}
        </div>
      </div>

      {/* 当前状态消息 */}
      {currentMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          error
            ? 'theme-status-block-danger'
            : isTraining
            ? 'theme-status-block-warning'
            : 'theme-section-soft theme-subtitle'
        }`}>
          <div className="flex items-start gap-2">
            {error ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : isTraining ? (
              <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
            ) : (
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-medium leading-relaxed">{currentMessage}</p>
          </div>
        </div>
      )}

      {/* 训练阶段列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {TRAINING_PHASES.map((phase, index) => {
          const phaseStatus = phaseStatuses[phase.id] || 'pending';
          const isActive = phaseStatus === 'queued' || phaseStatus === 'starting' || phaseStatus === 'running';
          const isCompleted = phaseStatus === 'completed';
          const isFailed = phaseStatus === 'failed';
          const isStopped = phaseStatus === 'stopped';
          const isSkipped = phaseStatus === 'skipped';
          const statusLabel = phaseStatus === 'queued'
            ? '排队中'
            : phaseStatus === 'starting'
            ? '启动中'
            : phaseStatus === 'running'
            ? '进行中'
            : isCompleted
            ? '已完成'
            : isFailed
            ? '失败'
            : isStopped
            ? '已停止'
            : isSkipped
            ? '未启用'
            : '待处理';

          return (
            <div
              key={phase.id}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? 'theme-card border-[var(--color-amber-400)]'
                  : isFailed
                  ? 'theme-status-block-danger'
                  : isCompleted
                  ? 'theme-card'
                  : 'theme-section-soft'
              }`}
            >
              {/* 阶段标题 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <phase.icon className={`w-4 h-4 ${
                    isActive ? 'theme-accent-text' : isCompleted ? 'theme-kicker' : 'text-[var(--color-gray-300)]'
                  }`} />
                  <span className={`text-sm font-bold ${
                    isActive ? 'theme-title' : isCompleted ? 'theme-subtitle' : 'theme-kicker'
                  }`}>
                    {phase.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isActive && <Loader2 className="theme-accent-text w-3 h-3 animate-spin" />}
                  {isCompleted && <Check className="theme-status-success w-3 h-3" />}
                  <span className={`text-[10px] ${
                    isActive ? 'theme-accent-text' : isCompleted ? 'theme-kicker' : 'text-[var(--color-gray-300)]'
                  }`}>
                    {statusLabel}
                  </span>
                </div>
              </div>

              {/* 子步骤 */}
              <div className="space-y-1 pl-6">
                {phase.subSteps.map((step, sIndex) => {
                  const status = getSubStepStatus(index, sIndex);
                  return (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        status === 'processing'
                          ? 'bg-[var(--color-amber-300)]'
                          : status === 'completed'
                          ? 'bg-[var(--color-success-500)]'
                          : status === 'error'
                          ? 'bg-[var(--color-danger-500)]'
                          : 'bg-[var(--color-gray-200)]'
                      }`} />
                      <span className={`text-[10px] ${
                        status === 'processing'
                          ? 'theme-accent-text font-medium'
                          : status === 'completed'
                          ? 'theme-kicker line-through'
                          : status === 'error'
                          ? 'theme-status-danger font-medium'
                          : 'text-[var(--color-gray-300)]'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 完成提示 */}
      {allFinished && (
        <div className="theme-status-block-info mt-4 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="theme-status-success w-5 h-5" />
            <span className="theme-status-success text-sm font-bold">训练完成！</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingMonitor;
