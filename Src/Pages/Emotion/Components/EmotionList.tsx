import React from 'react';
import { Smile, Plus, Loader2 } from 'lucide-react';
import { EmotionInfo } from '../types';
import CustomSelect from './CustomSelect';

interface EmotionListProps {
  emotions: EmotionInfo[];
  selectedEmotion: string;
  isLoadingEmotions: boolean;
  onEmotionSelect: (emotion: string) => void;
  onAddClick: () => void;
  selectedCharacterName: string;
}

const EmotionList: React.FC<EmotionListProps> = ({
  emotions,
  selectedEmotion,
  isLoadingEmotions,
  onEmotionSelect,
  onAddClick,
  selectedCharacterName,
}) => {
  const emotionOptions = emotions.map(emo => ({
    id: emo.emotion,
    name: `${emo.emotion} ${emo.text_language ? `(${emo.text_language})` : ''}`,
  }));

  return (
    <div className="theme-section flex-1 rounded-3xl p-5 flex flex-col relative overflow-hidden min-h-0">
      {/* Emotion Select Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <label className="theme-kicker text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <Smile className="w-3.5 h-3.5" /> 情感矩阵
        </label>
        <button
          onClick={onAddClick}
          disabled={!selectedCharacterName}
          className="theme-button-primary p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          title="添加新情感"
          aria-label="添加新情感"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Emotion Select Dropdown */}
      <div className="shrink-0">
        <CustomSelect
          label="选择情感"
          icon={<Smile className="theme-accent-icon w-4 h-4" />}
          value={selectedEmotion}
          options={emotionOptions}
          onChange={onEmotionSelect}
          isLoading={isLoadingEmotions}
          placeholder={emotions.length === 0 ? "暂无情感配置" : "选择情感进行配置"}
          variant="filled"
          searchable
        />
      </div>

      {/* Empty State */}
      {!isLoadingEmotions && emotions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center mt-4">
          <div className="theme-empty-state text-center p-6 border-2 border-dashed rounded-3xl w-full">
            <div className="theme-section-soft w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smile className="w-6 h-6 text-[var(--color-gray-200)]" />
            </div>
            <p className="theme-kicker text-[11px] font-bold uppercase tracking-wider">暂无情感配置</p>
            <p className="text-[10px] text-[var(--color-gray-300)] mt-1">点击右上角 + 添加新情感</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingEmotions && (
        <div className="flex-1 flex flex-col items-center justify-center mt-4">
          <div className="theme-kicker flex flex-col items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mb-3 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-wider">正在同步情感数据...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionList;
