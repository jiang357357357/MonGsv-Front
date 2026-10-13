import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export interface SynthesisAdvancedSettings {
  useModelDefaults: boolean;
  sampleSteps: number;
  cfgRate: number;
  seed: number;
  topK: number;
  topP: number;
  temperature: number;
  pauseSecond: number;
}

export const samplingDefaults = (version: string) => ({
  sampleSteps: version === 'v5turbo' ? 4 : 32,
  cfgRate: version === 'v5dev' ? 1.3 : 0,
});

interface Props {
  version: string;
  value: SynthesisAdvancedSettings;
  onChange: (value: SynthesisAdvancedSettings) => void;
  disabled: boolean;
}

const SynthesisAdvanced: React.FC<Props> = ({ version, value, onChange, disabled }) => {
  const isV5 = version === 'v5dev' || version === 'v5turbo';
  const supportsSteps = isV5 || version === 'v3' || version === 'v4';
  const defaults = samplingDefaults(version);
  const numberField = (key: keyof Omit<SynthesisAdvancedSettings, 'useModelDefaults'>, label: string,
    min: number, max: number, step: number, locked = false) => (
    <label className="flex min-w-0 flex-col gap-2 text-xs font-bold">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        disabled={disabled || locked}
        value={value[key]}
        onChange={(event) => {
          const next = Number(event.target.value || (key === 'seed' ? '-1' : '0'));
          if (Number.isFinite(next)) onChange({ ...value, [key]: next });
        }}
        className="theme-input w-full rounded-xl px-3 py-2 text-sm disabled:opacity-50"
      />
    </label>
  );

  return (
    <details className="theme-section-soft shrink-0 rounded-2xl px-4 py-3">
      <summary className="cursor-pointer text-sm font-bold">
        <SlidersHorizontal className="mr-2 inline h-4 w-4" />
        <span>高级合成参数</span>
        <span className="theme-subtitle ml-3 text-xs font-normal">
          {supportsSteps ? `${value.useModelDefaults ? '模型默认' : '自定义'} · ${value.useModelDefaults ? defaults.sampleSteps : value.sampleSteps} 步` : '文本采样'}
          {isV5 ? ` · CFG ${value.useModelDefaults ? defaults.cfgRate : value.cfgRate}` : ''}
          {` · ${value.seed === -1 ? '随机种子' : `种子 ${value.seed}`}`}
        </span>
      </summary>
      <fieldset disabled={disabled} className="mt-4 min-w-0 space-y-4">
        {supportsSteps ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={value.useModelDefaults}
                onChange={(event) => onChange({ ...value, useModelDefaults: event.target.checked, ...defaults })} />
              使用模型默认采样
            </label>
            {isV5 ? <p className="theme-subtitle text-xs">Turbo 默认 4 步 / CFG 0；Dev 默认 32 步 / CFG 1.3。</p> : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {numberField('sampleSteps', '采样步数', 1, 128, 1, value.useModelDefaults)}
              {isV5 ? numberField('cfgRate', 'CFG 系数', 0, 10, 0.1, value.useModelDefaults) : null}
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {numberField('seed', '随机种子（-1 为随机）', -1, 4294967295, 1)}
          {numberField('pauseSecond', '句间停顿（秒）', 0, 5, 0.05)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {numberField('topK', 'Top K', 1, 100, 1)}
          {numberField('topP', 'Top P', 0.01, 1, 0.01)}
          {numberField('temperature', '温度', 0.01, 2, 0.01)}
        </div>
        <p className="theme-subtitle text-xs leading-5">固定种子便于比较参数。语速在合成时生效，试听和下载保持相同的语速。</p>
      </fieldset>
    </details>
  );
};

export default SynthesisAdvanced;
