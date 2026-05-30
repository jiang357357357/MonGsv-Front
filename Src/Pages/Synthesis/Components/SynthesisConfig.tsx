import React from 'react';
import { User, Languages, Smile, Gauge, Scissors, Zap } from 'lucide-react';
import CustomSelect from '../../Emotion/Components/CustomSelect';
import { EmotionInfo } from '../types';
import { CUT_METHODS, LANGUAGES } from '../constants';

interface SynthesisConfigProps {
  selectedCharacterName: string;
  setSelectedCharacterName: (name: string) => void;
  characters: string[];
  isLoadingCharacters: boolean;
  selectedWorldId: number | '';
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
  selectedCutMethod: string;
  setSelectedCutMethod: (method: string) => void;
  selectedInferenceMode: string;
  setSelectedInferenceMode: (mode: string) => void;
  selectedEmotion: string;
  setSelectedEmotion: (emotion: string) => void;
  emotions: EmotionInfo[];
  isLoadingEmotions: boolean;
  speedFactor: number;
  setSpeedFactor: (speed: number) => void;
}

const SynthesisConfig: React.FC<SynthesisConfigProps> = ({
  selectedCharacterName,
  setSelectedCharacterName,
  characters,
  isLoadingCharacters,
  selectedWorldId,
  selectedLang,
  setSelectedLang,
  selectedCutMethod,
  setSelectedCutMethod,
  selectedInferenceMode,
  setSelectedInferenceMode,
  selectedEmotion,
  setSelectedEmotion,
  emotions,
  isLoadingEmotions,
  speedFactor,
  setSpeedFactor,
}) => {
  const inferenceModeOptions = [
    { id: 'normal', name: '普通推理' },
    { id: 'accelerated', name: '加速推理' },
  ];

  return (
    <div className="flex flex-col gap-6 flex-shrink-0">
      {/* Top Row: Role & Lang */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Role Select */}
        <div className="space-y-3">
          <CustomSelect
            label="角色名称"
            icon={<User className="theme-accent-icon w-4 h-4" />}
            value={selectedCharacterName}
            options={characters.map(name => ({ id: name, name }))}
            onChange={setSelectedCharacterName}
            isLoading={isLoadingCharacters}
            placeholder={isLoadingCharacters ? "加载中..." : selectedWorldId === '' ? "请先选择世界" : characters.length === 0 ? "暂无角色" : "选择角色"}
            variant="filled"
          />
        </div>

        {/* Language Select */}
        <div className="space-y-3">
          <CustomSelect
            label="文本语种"
            icon={<Languages className="theme-info-text w-4 h-4" />}
            value={selectedLang}
            options={LANGUAGES.map(l => ({ id: l, name: l }))}
            onChange={setSelectedLang}
            variant="filled"
          />
        </div>
      </div>

      {/* Second Row: Emotion, Cut Method & Inference */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
        <div className="sm:col-span-6 space-y-3">
          <CustomSelect
            label="情感风格"
            icon={<Smile className="theme-accent-icon w-4 h-4" />}
            value={selectedEmotion}
            options={emotions.map(e => ({
              id: e.name,
              name: e.text_language ? `${e.name} (${e.text_language})` : e.name,
            }))}
            onChange={setSelectedEmotion}
            isLoading={isLoadingEmotions}
            placeholder={isLoadingEmotions ? "正在同步情感矩阵..." : emotions.length === 0 ? "当前角色暂无情感数据" : "选择情感风格"}
            className="w-full"
            variant="filled"
          />
        </div>

        <div className="sm:col-span-3 space-y-3">
          <CustomSelect
            label="切分方式"
            icon={<Scissors className="theme-info-text w-4 h-4" />}
            value={selectedCutMethod}
            options={CUT_METHODS.map(method => ({ id: method, name: method }))}
            onChange={setSelectedCutMethod}
            className="w-full"
            variant="filled"
          />
        </div>

        <div className="sm:col-span-3 space-y-3">
          <CustomSelect
            label="推理模式"
            icon={<Zap className="theme-info-text w-4 h-4" />}
            value={selectedInferenceMode}
            options={inferenceModeOptions}
            onChange={setSelectedInferenceMode}
            className="w-full"
            variant="filled"
          />
        </div>
      </div>

      {/* Third Row: Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
        <div className="sm:col-span-5 sm:col-start-8 space-y-3">
          <div className="theme-input flex flex-col px-5 py-2.5 rounded-[20px] hover:border-[var(--color-amber-400)] transition-all">
            <span className="theme-subtitle text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 mb-1">
              <Gauge className="w-3 h-3" />
              语速系数
            </span>
            <div 
              className="flex items-center gap-3 mt-1"
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.01 : 0.01;
                const newValue = Math.max(0.5, Math.min(2.0, speedFactor + delta));
                setSpeedFactor(Math.round(newValue * 100) / 100);
              }}
            >
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.01" 
                value={speedFactor} 
                onChange={(e) => setSpeedFactor(parseFloat(e.target.value))}
                className="flex-1 accent-[var(--color-amber-400)] h-2 bg-[var(--color-gray-300)] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min="0.5"
                  max="2.0"
                  step="0.01"
                  value={speedFactor.toFixed(2)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0.5 && value <= 2.0) {
                      setSpeedFactor(Math.round(value * 100) / 100);
                    }
                  }}
                  onWheel={(e) => {
                    e.stopPropagation();
                    const delta = e.deltaY > 0 ? -0.01 : 0.01;
                    const newValue = Math.max(0.5, Math.min(2.0, speedFactor + delta));
                    setSpeedFactor(Math.round(newValue * 100) / 100);
                  }}
                  className="theme-title w-14 text-right text-sm font-black bg-transparent border-none outline-none focus:ring-0 p-0"
                />
                <span className="theme-kicker text-[10px] font-mono">x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynthesisConfig;
