import React from 'react';
import { BrainCircuit, Box } from 'lucide-react';
import { TrainingParams } from '../types';

interface TrainingParamsSectionProps {
  params: TrainingParams;
  isTraining: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const TrainingParamsSection: React.FC<TrainingParamsSectionProps> = ({ params, isTraining, onChange }) => (
  <div className="training-model-params-grid">
    {([
      { target: 'sovits', name: 'SoVITS', enabled: params.trainSovits, toggle: 'trainSovits', batch: 'sovitsBatchSize', epoch: 'sovitsEpoch', description: '学习角色的音色与发声特点', Icon: BrainCircuit },
      { target: 'gpt', name: 'GPT', enabled: params.trainGpt, toggle: 'trainGpt', batch: 'gptBatchSize', epoch: 'gptEpoch', description: '学习语句节奏与表达方式', Icon: Box },
    ] as const).map(model => (
      <section key={model.target} className={'training-model-params ' + (model.enabled ? 'is-enabled' : '')}>
        <div className="training-model-params-header">
          <div className="training-model-title"><model.Icon size={18} /><strong>{model.name}</strong></div>
          <label className="training-model-toggle">
            <input aria-label={'训练 ' + model.name} name={model.toggle} type="checkbox" checked={model.enabled} disabled={isTraining} onChange={onChange} />
            {model.enabled ? '已选择' : '未选择'}
          </label>
        </div>
        <p>{model.description}</p>
        <div className="training-model-fields">
          <label className="training-field" htmlFor={model.batch}>
            <span>每批样本 · Batch</span>
            <input id={model.batch} aria-label={model.name + ' Batch'} name={model.batch} value={params[model.batch]} onChange={onChange} type="number" min="1" step="1" disabled={isTraining || !model.enabled} className="training-control" />
          </label>
          <label className="training-field" htmlFor={model.epoch}>
            <span>训练轮数 · Epoch</span>
            <input id={model.epoch} aria-label={model.name + ' Epoch'} name={model.epoch} value={params[model.epoch]} onChange={onChange} type="number" min="1" step="1" disabled={isTraining || !model.enabled} className="training-control" />
          </label>
        </div>
      </section>
    ))}
  </div>
);

export default TrainingParamsSection;
