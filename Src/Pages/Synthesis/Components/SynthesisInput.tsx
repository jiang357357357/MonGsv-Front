import React from 'react';
import { Sparkles, Mic, Loader2 } from 'lucide-react';

interface SynthesisInputProps {
  text: string;
  setText: (text: string) => void;
  isProcessing: boolean;
  selectedEmotion: string;
  handleGenerate: () => void;
}

const SynthesisInput: React.FC<SynthesisInputProps> = ({
  text,
  setText,
  isProcessing,
  selectedEmotion,
  handleGenerate,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3">
      <label className="theme-title flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
        <Sparkles className="theme-accent-text w-4 h-4" />
        文本输入
      </label>
      
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Text Input Area (Flex-1) */}
        <div className="flex-1 relative group">
          <textarea
            className="theme-input w-full h-full text-lg rounded-[32px] p-8 resize-none transition-all font-medium leading-relaxed"
            placeholder="在此输入想要合成的文本..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="absolute bottom-6 right-6 flex items-center gap-3 opacity-0 group-focus-within:opacity-100 transition-opacity">
            <span className="theme-kicker text-[10px] font-bold uppercase tracking-widest">{text.length} characters</span>
          </div>
        </div>

        {/* Action Button - Vertical Alignment with Textarea */}
        <div className="w-48 flex flex-col shrink-0">
          <button 
            onClick={handleGenerate}
            disabled={isProcessing || !text.trim() || !selectedEmotion}
            className={`flex-1 rounded-[32px] font-black flex flex-col items-center justify-center gap-4 transition-all text-xs tracking-widest uppercase px-4 text-center border ${
              isProcessing 
              ? 'theme-status-block-warning animate-pulse cursor-wait' 
              : !text.trim() || !selectedEmotion
              ? 'theme-button-disabled'
              : 'theme-button-amber'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>合成中...</span>
              </>
            ) : (
              <>
                <div className="p-4 bg-[rgba(255,255,255,0.12)] rounded-2xl group-hover:bg-[rgba(0,0,0,0.08)] transition-colors">
                  <Mic className="w-8 h-8" />
                </div>
                <span>开始<br/>合成</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SynthesisInput;
