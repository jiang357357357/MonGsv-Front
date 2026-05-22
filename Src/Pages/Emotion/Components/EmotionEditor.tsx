import React, { useState, useEffect } from 'react';
import { Mic, FileAudio, Save, Trash2, Loader2, CheckCircle2, AlertCircle, X, Upload, Music, Waves, Globe } from 'lucide-react';
import { EmotionInfo } from '../types';
import AudioPlayer from './AudioPlayer';
import { getAudioFileUrl, transcribeAudio, getReferenceTextLanguages } from '../Services/emotionService';
import { createLogger } from '../../../../System/Log/logger';
import CustomSelect from './CustomSelect';

const logger = createLogger('pages/emotion', 'EmotionEditor');

interface EmotionEditorProps {
  emotionInfo: EmotionInfo;
  version: string;
  worldName: string;
  characterName: string;
  editText: string;
  editTextLanguage: string;
  selectedFile: File | null;
  selectedFileUrl: string | null;
  saveStatus: 'idle' | 'success' | 'error';
  error: string | null;
  isSaving: boolean;
  isDeleting: boolean;
  onTextChange: (text: string) => void;
  onTextLanguageChange: (text: string) => void;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  onSave: () => void;
  onDelete: () => void;
  onErrorDismiss: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const EmotionEditor: React.FC<EmotionEditorProps> = ({
  emotionInfo,
  version,
  worldName,
  characterName,
  editText,
  editTextLanguage,
  selectedFile,
  selectedFileUrl,
  saveStatus,
  error,
  isSaving,
  isDeleting,
  onTextChange,
  onTextLanguageChange,
  onFileSelect,
  onFileClear,
  onSave,
  onDelete,
  onErrorDismiss,
  fileInputRef,
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['zh']);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);

  const languageOptions = availableLanguages.map(lang => ({ id: lang, name: lang }));

  // 加载参考文本语言列表
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingLanguages(true);
      try {
        const languages = await getReferenceTextLanguages();
        setAvailableLanguages(languages);
      } catch (err) {
        logger.error('加载参考列表失败', err);
      } finally {
        setIsLoadingLanguages(false);
      }
    };
    loadData();
  }, []);

  const handleTranscribe = async (audioFileOrPath?: string | File) => {
    setIsTranscribing(true);
    try {
      let request: { audio_file?: File; audio_path?: string; asr_lang: string } | null = null;

      if (audioFileOrPath instanceof File) {
        request = { audio_file: audioFileOrPath, asr_lang: 'zh' };
      } else if (typeof audioFileOrPath === 'string' && audioFileOrPath.trim()) {
        request = { audio_path: audioFileOrPath.trim(), asr_lang: 'zh' };
      } else if (selectedFile) {
        request = { audio_file: selectedFile, asr_lang: 'zh' };
      } else if (emotionInfo.audio_files.length > 0) {
        request = { audio_path: emotionInfo.audio_files[0], asr_lang: 'zh' };
      }

      if (!request) {
        alert('没有可转录的音频文件');
        return;
      }

      const result = await transcribeAudio(request);
      
      // 将转录结果填入参考文本
      onTextChange(result.text);
      logger.info('语音转录成功', { text: result.text });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '转录失败';
      logger.error('语音转录失败', { error: errorMessage });
      alert(`转录失败: ${errorMessage}`);
    } finally {
      setIsTranscribing(false);
    }
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="theme-section flex-1 rounded-3xl p-8 flex flex-col relative overflow-hidden">
      <div className="flex flex-col h-full min-h-0">
        {/* Error Message - Fixed at top */}
        {error && (
          <div className="theme-status-block-danger mb-4 flex items-center gap-2 p-3 rounded-xl text-sm shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={onErrorDismiss}
              className="theme-button-danger-ghost shrink-0"
              aria-label="关闭错误提示"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
          <div className="flex flex-col gap-6">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="theme-amber-gradient w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                  {emotionInfo.emotion[0]}
                </div>
                <div>
                  <h2 className="theme-title text-2xl font-bold">{emotionInfo.emotion}</h2>
                  <div className="theme-subtitle flex items-center gap-2 text-xs font-mono">
                    <span>{characterName}</span>
                    <span>•</span>
                    <span>{worldName}</span>
                    <span>•</span>
                    <span>{version}</span>
                    <span>•</span>
                    <span className="theme-tag-amber px-1.5 py-0.5 rounded font-sans font-bold">
                      {emotionInfo.text_language || 'zh'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={onSave}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                    isSaving
                      ? 'theme-button-disabled'
                      : saveStatus === 'success'
                      ? 'theme-status-block-info'
                      : 'theme-button-primary'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 保存中...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> 已保存
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> 保存配置
                    </>
                  )}
                </button>
                <button 
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="theme-button-danger-ghost p-2 border rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Reference Text Input */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between px-1">
                <label className="theme-kicker flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                  <Mic className="w-3.5 h-3.5" /> 语义参考文本
                </label>
                <button
                  onClick={() => handleTranscribe()}
                  disabled={isTranscribing || (!selectedFile && emotionInfo.audio_files.length === 0)}
                  className="theme-info-text flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-30"
                >
                  {isTranscribing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> 正在解析...</>
                  ) : (
                    <><Waves className="w-3 h-3" /> 语音转文本</>
                  )}
                </button>
              </div>
              <textarea 
                value={editText}
                onChange={(e) => onTextChange(e.target.value)}
                className="theme-input w-full h-32 rounded-xl p-4 text-sm font-black resize-none transition-all custom-scrollbar"
                placeholder="输入用于定义该情感的参考语音文本..."
              />
            </div>

            {/* Reference Text Language Input */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <div className="space-y-2">
                <label className="theme-kicker flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-1">
                  <Globe className="w-3.5 h-3.5" /> 参考文本语言
                </label>
                <CustomSelect
                  value={editTextLanguage}
                  options={languageOptions}
                  onChange={onTextLanguageChange}
                  isLoading={isLoadingLanguages}
                  placeholder="选择语言"
                  variant="filled"
                />
              </div>
            </div>

            {/* Audio Files Upload & List */}
            <div className="space-y-4 shrink-0">
              {emotionInfo.audio_files.length > 0 && (
                <div className="space-y-3">
                  <label className="theme-kicker flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-1">
                    <FileAudio className="w-3.5 h-3.5" /> 已保存的采样矩阵
                  </label>
                  <div className="space-y-3">
                    {emotionInfo.audio_files.map((audioFile, index) => {
                      const audioUrl = getAudioFileUrl(audioFile);
                      const fileName = audioFile.split('/').pop() || audioFile;
                      
                      logger.debug('🎵 渲染音频文件', {
                        '索引': index,
                        '原始路径': audioFile,
                        '构建的URL': audioUrl,
                        '显示文件名': fileName,
                      });
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="theme-section-soft flex items-center justify-between p-2 rounded-lg group">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileAudio className="theme-accent-text w-4 h-4 shrink-0" />
                              <span className="theme-subtitle text-sm font-mono truncate" title={audioFile}>
                                {fileName}
                              </span>
                            </div>
                          </div>
                          <AudioPlayer
                            src={audioUrl}
                            fileName={fileName}
                            onError={(error) => {
                              logger.error('音频播放失败', {
                                audioFile,
                                audioUrl,
                                error: error.message,
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedFile && selectedFileUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="theme-kicker flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                      <Music className="w-3.5 h-3.5" /> 待保存的替换采样
                    </label>
                    <button
                      onClick={onFileClear}
                      className="theme-button-danger-ghost px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-3 h-3" />
                      清除文件
                    </button>
                  </div>
                  <AudioPlayer
                    src={selectedFileUrl}
                    fileName={selectedFile.name}
                    onError={(error) => {
                      logger.error('音频播放失败', { error: error.message });
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="theme-kicker flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                      <FileAudio className="w-3.5 h-3.5" /> {emotionInfo.audio_files.length > 0 ? '替换采样音频' : '音频采样矩阵'}
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".wav,.mp3,.flac,.m4a,.ogg,.aac,audio/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="theme-button-ghost flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      <Upload className="w-3 h-3" /> {emotionInfo.audio_files.length > 0 ? '选择替换文件' : '载入采样'}
                    </button>
                  </div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        onFileSelect(files[0]);
                      }
                    }}
                    className="theme-upload-zone group relative border-2 border-dashed rounded-[32px] p-10 text-center transition-all cursor-pointer overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
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
                        <p className="theme-title font-black text-sm tracking-tight">
                          {emotionInfo.audio_files.length > 0 ? '拖拽或点击替换采样' : '拖拽或点击上传采样'}
                        </p>
                        <p className="theme-kicker text-[9px] font-bold uppercase tracking-[0.15em]">Support WAV, MP3, FLAC (Max 10MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionEditor;

