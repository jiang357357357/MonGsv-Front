import React from 'react';
import { BrainCircuit, Box } from 'lucide-react';
import { TrainingParams } from '../types';

interface TrainingParamsSectionProps {
  params: TrainingParams;
  isTraining: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const TrainingParamsSection: React.FC<TrainingParamsSectionProps> = ({ params, isTraining, onChange }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="theme-section flex flex-1 flex-col gap-4 rounded-xl p-5">
          <div className="theme-title flex items-center gap-3 text-base font-black">
            <BrainCircuit className="h-5 w-5" /> SoVITS 参数
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="training-param-field flex items-center gap-3">
              <label htmlFor="sovitsBatchSize" className="theme-subtitle whitespace-nowrap text-sm font-black">Batch</label>
              <input id="sovitsBatchSize" name="sovitsBatchSize" value={params.sovitsBatchSize} onChange={onChange} type="number" disabled={isTraining} className="theme-input training-param-input rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-center text-lg font-black transition-all disabled:opacity-50" />
            </div>
            <div className="training-param-field flex items-center gap-3">
              <label htmlFor="sovitsEpoch" className="theme-subtitle whitespace-nowrap text-sm font-black">Epoch</label>
              <input id="sovitsEpoch" name="sovitsEpoch" value={params.sovitsEpoch} onChange={onChange} type="number" disabled={isTraining} className="theme-input training-param-input rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-center text-lg font-black transition-all disabled:opacity-50" />
            </div>
          </div>
        </div>

        <div className="theme-section flex flex-1 flex-col gap-4 rounded-xl p-5">
          <div className="theme-title flex items-center gap-3 text-base font-black">
            <Box className="h-5 w-5" /> GPT 参数
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="training-param-field flex items-center gap-3">
              <label htmlFor="gptBatchSize" className="theme-subtitle whitespace-nowrap text-sm font-black">Batch</label>
              <input id="gptBatchSize" name="gptBatchSize" value={params.gptBatchSize} onChange={onChange} type="number" disabled={isTraining} className="theme-input training-param-input rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-center text-lg font-black transition-all disabled:opacity-50" />
            </div>
            <div className="training-param-field flex items-center gap-3">
              <label htmlFor="gptEpoch" className="theme-subtitle whitespace-nowrap text-sm font-black">Epoch</label>
              <input id="gptEpoch" name="gptEpoch" value={params.gptEpoch} onChange={onChange} type="number" disabled={isTraining} className="theme-input training-param-input rounded-xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-center text-lg font-black transition-all disabled:opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingParamsSection;
