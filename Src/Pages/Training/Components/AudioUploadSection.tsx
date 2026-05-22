import React, { useRef, useState } from 'react';
import { Music, Upload, FileAudio, X } from 'lucide-react';

interface AudioUploadSectionProps {
  audioFiles: File[];
  isTraining: boolean;
  onFilesSelected: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
}

const AudioUploadSection: React.FC<AudioUploadSectionProps> = ({
  audioFiles,
  isTraining,
  onFilesSelected,
  onRemoveFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onFilesSelected(e.dataTransfer.files);
  };

  return (
    <div className="theme-section-soft h-full p-4 rounded-xl flex flex-col gap-3">
      <div className="theme-title flex items-center gap-2 text-xs font-black uppercase tracking-wider">
        <Music className="w-4 h-4" /> 训练音频文件
      </div>

      {audioFiles.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex-1 border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center
            ${isDragOver ? 'theme-upload-zone-active' : 'theme-upload-zone'}
            ${isTraining ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg,.aac"
            onChange={handleFileInputChange}
            disabled={isTraining}
            className="hidden"
            aria-label="选择训练音频文件"
          />
          <Upload
            className={`w-8 h-8 mb-2 ${isDragOver ? 'theme-accent-text' : 'theme-kicker'}`}
          />
          <p className="theme-title text-xs font-black">点击或拖拽上传</p>
          <p className="theme-subtitle text-[10px] font-bold mt-1">WAV, MP3, FLAC...</p>
        </div>
      )}

      {audioFiles.length > 0 && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isTraining}
            className="theme-button-secondary w-full py-2 border border-dashed rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            添加更多
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg,.aac"
            onChange={handleFileInputChange}
            disabled={isTraining}
            className="hidden"
            aria-label="选择训练音频文件"
          />
          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
            {audioFiles.map((file, index) => (
              <div
                key={index}
                className="theme-input flex items-center justify-between p-2 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileAudio className="theme-accent-text w-4 h-4 shrink-0" />
                  <span className="theme-subtitle text-xs font-mono truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(index);
                  }}
                  disabled={isTraining}
                  className="theme-button-danger-ghost p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="删除"
                  aria-label={`删除文件 ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {audioFiles.length > 0 && (
            <div className="theme-status-block-info p-2 rounded-lg text-[10px] leading-relaxed">
              {audioFiles.length === 1
                ? '已选择 1 个文件，将在训练时自动上传'
                : `已选择 ${audioFiles.length} 个文件（将使用第一个文件）`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioUploadSection;
