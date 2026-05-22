import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smile, Mic, Music, Plus, X, AlertCircle, Loader2, Waves, Globe } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { transcribeAudio, getAudioFileUrl, getReferenceTextLanguages } from '../Services/emotionService';
import CustomSelect from './CustomSelect';

interface AddEmotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: {
    emotionName: string;
    text: string;
    audioFile?: File | null;
    audioSourcePath?: string | null;
    textLanguage?: string;
  }) => Promise<void>;
  version: string;
  characterName: string;
  slicedDirectory?: string;
  slicedAudioFiles?: string[];
  existingEmotions: string[];
  error: string | null;
  onErrorChange: (error: string | null) => void;
}

const AddEmotionModal: React.FC<AddEmotionModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  version,
  characterName,
  slicedDirectory = '',
  slicedAudioFiles = [],
  existingEmotions,
  error,
  onErrorChange,
}) => {
  const [emotionName, setEmotionName] = useState('');
  const [emotionText, setEmotionText] = useState('');
  const [textLanguage, setTextLanguage] = useState('zh');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['zh']);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [selectedSlicedAudioPath, setSelectedSlicedAudioPath] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languageOptions = availableLanguages.map(lang => ({ id: lang, name: lang }));
  const slicedAudioOptions = slicedAudioFiles.map((path) => ({
    id: path,
    name: path.split(/[\\/]/).pop() || path,
  }));
  const previewAudioUrl = audioFileUrl || (selectedSlicedAudioPath ? getAudioFileUrl(selectedSlicedAudioPath) : null);
  const previewAudioName = audioFile?.name || (selectedSlicedAudioPath ? selectedSlicedAudioPath.split(/[\\/]/).pop() || selectedSlicedAudioPath : undefined);
  const hasSelectedAudio = Boolean(audioFile || selectedSlicedAudioPath);

  // 加载可用语言列表
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setIsLoadingLanguages(true);
        try {
          const languages = await getReferenceTextLanguages();
          
          setAvailableLanguages(languages);
          if (!languages.includes(textLanguage)) {
            setTextLanguage(languages[0] || 'zh');
          }
        } catch (err) {
          console.error('加载参考列表失败', err);
          // 保持默认值
        } finally {
          setIsLoadingLanguages(false);
        }
      };
      loadData();
    }
  }, [isOpen]);

  // 重置表单当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setEmotionName('');
      setEmotionText('');
      setTextLanguage('zh');
      setAudioFile(null);
      setSelectedSlicedAudioPath('');
      if (audioFileUrl) {
        URL.revokeObjectURL(audioFileUrl);
        setAudioFileUrl(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onErrorChange(null);
    }
  }, [isOpen, audioFileUrl, onErrorChange]);

  // 清理 blob URL
  useEffect(() => {
    return () => {
      if (audioFileUrl && audioFileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioFileUrl);
      }
    };
  }, [audioFileUrl]);

  const handleFileSelect = (file: File) => {
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/m4a', 'audio/ogg', 'audio/aac'];
    const validExtensions = ['.wav', '.mp3', '.flac', '.m4a', '.ogg', '.aac'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      onErrorChange('不支持的音频格式，请选择 WAV, MP3, FLAC, M4A, OGG 或 AAC 格式的文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onErrorChange('文件大小不能超过 10MB');
      return;
    }

    setAudioFile(file);
    setSelectedSlicedAudioPath('');
    onErrorChange(null);
    
    if (audioFileUrl) {
      URL.revokeObjectURL(audioFileUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioFileUrl(url);
  };

  const handleSlicedAudioSelect = (path: string) => {
    setSelectedSlicedAudioPath(path);
    setAudioFile(null);
    onErrorChange(null);

    if (audioFileUrl) {
      URL.revokeObjectURL(audioFileUrl);
      setAudioFileUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile && !selectedSlicedAudioPath) return;

    setIsTranscribing(true);
    try {
      const request = audioFile
        ? { audio_file: audioFile, asr_lang: 'zh' as const }
        : { audio_path: selectedSlicedAudioPath || undefined, asr_lang: 'zh' as const };

      const result = await transcribeAudio(request);
      
      // 将转录结果填入参考文本
      setEmotionText(result.text);
      // 如果转录结果有语言信息，尝试自动设置语言
      if (result.language) {
        const mappedLang = result.language.toLowerCase();
        if (availableLanguages.includes(mappedLang)) {
          setTextLanguage(mappedLang);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '转录失败';
      onErrorChange(`转录失败: ${errorMessage}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAdd = async () => {
    if (!emotionName.trim()) {
      onErrorChange('请输入情感名称');
      return;
    }

    if (!emotionText.trim()) {
      onErrorChange('请输入参考文本');
      return;
    }

    if (!audioFile && !selectedSlicedAudioPath) {
      onErrorChange('请选择音频文件，或从切分目录中选择一个采样');
      return;
    }

    if (existingEmotions.includes(emotionName.trim())) {
      onErrorChange('该情感名称已存在');
      return;
    }

    setIsAdding(true);
    try {
      await onAdd({
        emotionName: emotionName.trim(),
        text: emotionText.trim(),
        audioFile,
        audioSourcePath: selectedSlicedAudioPath || undefined,
        textLanguage,
      });
      onClose();
    } catch (err) {
      // 错误由父组件处理
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="theme-overlay fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300" onClick={handleClose}>
      <div 
        className="theme-section theme-frost-gradient backdrop-blur-2xl rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background element */}
        <div className="theme-empty-orb-amber absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <div className="theme-button-primary w-12 h-12 rounded-2xl flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="theme-title text-2xl font-black tracking-tight">新增情感定义</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="theme-tag text-xs font-mono uppercase tracking-[0.18em] px-2.5 py-1 rounded-full">{characterName}</span>
                <span className="theme-kicker">/</span>
                <span className="theme-kicker text-xs font-mono uppercase tracking-[0.18em]">{version}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="theme-button-ghost w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 active:scale-90"
            disabled={isAdding}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 relative z-10">
          <div className="space-y-8">
            {/* Error Message */}
            {error && (
              <div className="theme-status-block-danger flex items-center gap-3 p-4 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1 tracking-wide">{error}</span>
                <button
                  onClick={() => onErrorChange(null)}
                  className="theme-button-danger-ghost w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Form Section: Identity & Language */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="theme-kicker text-sm font-black uppercase tracking-[0.12em] flex items-center gap-2 px-1">
                  <Smile className="w-5 h-5" /> 情感标识符
                </label>
                <input
                  type="text"
                  value={emotionName}
                  onChange={(e) => setEmotionName(e.target.value)}
                  placeholder="如：Happy, Sad..."
                  className="theme-input w-full text-sm font-bold rounded-2xl px-4 py-3.5 transition-all"
                  disabled={isAdding}
                />
              </div>

              <div className="space-y-2">
                <label className="theme-kicker text-sm font-black uppercase tracking-[0.12em] flex items-center gap-2 px-1">
                  <Globe className="w-5 h-5" /> 参考语言环境
                </label>
                <CustomSelect
                  value={textLanguage}
                  options={languageOptions}
                  onChange={setTextLanguage}
                  disabled={isAdding}
                  isLoading={isLoadingLanguages}
                  placeholder="选择语言"
                  variant="filled"
                />
              </div>
            </div>

            {/* Form Section: Reference Text */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="theme-kicker text-sm font-black uppercase tracking-[0.12em] flex items-center gap-2">
                  <Mic className="w-5 h-5" /> 语义参考文本
                </label>
                <button
                  onClick={handleTranscribe}
                  disabled={isTranscribing || isAdding || !hasSelectedAudio}
                  className="theme-info-text flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] transition-colors disabled:opacity-30"
                >
                  {isTranscribing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> 正在解析...</>
                  ) : (
                    <><Waves className="w-3 h-3" /> 语音转文本</>
                  )}
                </button>
              </div>
              <textarea
                value={emotionText}
                onChange={(e) => setEmotionText(e.target.value)}
                placeholder="在此输入参考音频对应的文字内容..."
                rows={4}
                className="theme-input w-full text-sm font-medium rounded-[24px] p-5 transition-all resize-none custom-scrollbar"
                disabled={isAdding}
              />
            </div>

            {/* Form Section: Audio Upload */}
            <div className="space-y-3">
              <label className="theme-kicker text-sm font-black uppercase tracking-[0.12em] flex items-center gap-2 px-1">
                <Music className="w-5 h-5" /> 音频采样文件
              </label>

              {slicedDirectory && (
                <div className="theme-section-soft rounded-[24px] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="theme-title text-sm font-black tracking-tight">角色切分目录</p>
                      <p className="theme-kicker text-[10px] font-bold leading-relaxed break-all">{slicedDirectory}</p>
                    </div>
                    <span className="theme-tag shrink-0 text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-1 rounded-full">
                      {slicedAudioFiles.length} clips
                    </span>
                  </div>

                  {slicedAudioFiles.length > 0 ? (
                    <div className="space-y-2">
                      <CustomSelect
                        value={selectedSlicedAudioPath}
                        options={slicedAudioOptions}
                        onChange={handleSlicedAudioSelect}
                        placeholder="从角色 sliced 目录选择采样音频"
                        variant="filled"
                        searchable
                      />
                      <p className="theme-kicker text-[10px] font-bold tracking-[0.08em] px-1">
                        可直接使用该角色当前版本切分好的音频，无需重新上传。
                      </p>
                    </div>
                  ) : (
                    <p className="theme-kicker text-[10px] font-bold tracking-[0.08em] px-1">
                      当前目录还没有可用的切分音频，请继续拖拽或上传本地文件。
                    </p>
                  )}
                </div>
              )}
              
              {hasSelectedAudio && previewAudioUrl ? (
                <div className="theme-section-soft rounded-[24px] p-5 space-y-4">
                  {selectedSlicedAudioPath && !audioFile && (
                    <p className="theme-kicker text-[10px] font-bold uppercase tracking-[0.12em]">
                      当前采样来源: sliced 目录
                    </p>
                  )}
                  <AudioPlayer src={previewAudioUrl} fileName={previewAudioName} />
                  <button
                    onClick={() => {
                      setAudioFile(null);
                      setSelectedSlicedAudioPath('');
                      if (audioFileUrl) {
                        URL.revokeObjectURL(audioFileUrl);
                        setAudioFileUrl(null);
                      }
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="theme-button-danger-ghost theme-card w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                    disabled={isAdding}
                  >
                    <X className="w-3 h-3" /> 移除并重新选择
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="theme-upload-zone group relative border-2 border-dashed rounded-[32px] p-10 text-center transition-all cursor-pointer overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelect(file);
                      }
                    }}
                    className="hidden"
                    disabled={isAdding}
                  />
                  
                  {/* Visual decorative elements for drop zone */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="theme-title absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2" />
                    <div className="theme-title absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2" />
                    <div className="theme-title absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2" />
                    <div className="theme-title absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2" />
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="theme-card w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Music className="theme-title w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="theme-title font-black text-sm tracking-tight">拖拽或点击上传采样</p>
                      <p className="theme-kicker text-[9px] font-bold uppercase tracking-[0.15em]">Support WAV, MP3, FLAC (Max 10MB)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="theme-section-soft px-8 py-6 border-t flex gap-4 shrink-0 relative z-10">
          <button
            onClick={handleClose}
            disabled={isAdding}
            className="theme-button-secondary flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            放弃添加
          </button>
          <button
            onClick={handleAdd}
            disabled={isAdding || !emotionName.trim() || !emotionText.trim() || !hasSelectedAudio}
            className={`flex-[1.5] px-6 py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
              isAdding || !emotionName.trim() || !emotionText.trim() || !hasSelectedAudio
                ? 'theme-button-disabled'
                : 'theme-button-primary'
            }`}
          >
            {isAdding ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 正在写入矩阵...</>
            ) : (
              <><Plus className="w-4 h-4" /> 确认注入情感</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddEmotionModal;

