import React from 'react';
import TrainingMonitor from '../../Components/TrainingMonitor';
import { TrainingStepStatus } from '../../types';

interface TrainingMonitorPageProps {
  isTraining: boolean;
  activePhaseIndex: number;
  completedPhases: string[];
  error: string | null;
  currentMessage: string;
  getSubStepStatus: (phaseIndex: number, subStepIndex: number) => TrainingStepStatus;
}

const TrainingMonitorPage: React.FC<TrainingMonitorPageProps> = ({
  isTraining,
  activePhaseIndex,
  completedPhases,
  error,
  currentMessage,
  getSubStepStatus,
}) => {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0">
        <h3 className="theme-title text-xl font-black tracking-tight">训练监控</h3>
        <p className="theme-subtitle mt-1 text-sm">查看切分、识别、特征提取与模型训练的实时状态。</p>
      </div>

      <div className="theme-divider my-4 border-t" />

      <div className="flex-1 min-h-0">
        <div className="theme-section-soft h-full rounded-xl border p-4">
          <TrainingMonitor
            isTraining={isTraining}
            activePhaseIndex={activePhaseIndex}
            completedPhases={completedPhases}
            error={error}
            currentMessage={currentMessage}
            getSubStepStatus={getSubStepStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default TrainingMonitorPage;
