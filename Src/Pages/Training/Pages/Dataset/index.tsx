import React from 'react';
import { FolderInput, FolderOutput, Languages } from 'lucide-react';
import { TrainingParams } from '../../types';

interface TrainingDatasetPageProps {
  params: TrainingParams;
  isTraining: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const TrainingDatasetPage: React.FC<TrainingDatasetPageProps> = ({
  params,
  isTraining,
  onChange,
}) => {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0">
        <h3 className="theme-title text-xl font-black tracking-tight">训练数据</h3>
        <p className="theme-subtitle mt-1 text-sm">统一网关按目录读取训练数据，不再从浏览器上传音频。</p>
      </div>

      <div className="theme-divider my-4 border-t" />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
        <div className="theme-section-soft rounded-xl border p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FolderInput className="theme-accent-text w-4 h-4" />
            <span className="theme-title text-sm font-black">输入与输出目录</span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="inputAudioDir" className="theme-subtitle text-xs font-black">输入音频目录</label>
            <input
              id="inputAudioDir"
              name="inputAudioDir"
              value={params.inputAudioDir}
              onChange={onChange}
              type="text"
              disabled={isTraining}
              placeholder="例如: Data\\Music\\test\\input"
              className="theme-input rounded-lg px-3 py-2 text-sm disabled:opacity-50"
            />
            <p className="theme-kicker text-[11px]">这里填音频文件夹路径，不是单个音频文件。</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="outputDir" className="theme-subtitle text-xs font-black">输出根目录</label>
            <div className="flex items-center gap-2">
              <FolderOutput className="theme-info-text w-4 h-4" />
              <input
                id="outputDir"
                name="outputDir"
                value={params.outputDir}
                onChange={onChange}
                type="text"
                disabled={isTraining}
                placeholder="例如: Data\\Output"
                className="theme-input flex-1 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <p className="theme-kicker text-[11px]">训练引导会从这里展开训练目录，并生成切分、ASR、Hubert、语义编码等中间产物。</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="language" className="theme-subtitle text-xs font-black">标注语言</label>
            <div className="flex items-center gap-2">
              <Languages className="theme-kicker w-4 h-4" />
              <select
                id="language"
                name="language"
                value={params.language}
                onChange={onChange}
                disabled={isTraining}
                className="theme-input flex-1 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="zh">zh</option>
                <option value="yue">yue</option>
                <option value="en">en</option>
                <option value="ja">ja</option>
                <option value="ko">ko</option>
                <option value="auto">auto</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDatasetPage;
