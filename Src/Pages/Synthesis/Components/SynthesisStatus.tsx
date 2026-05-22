import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AudioLines, Download, Square } from 'lucide-react';
import { audioBufferToWavBlob, formatAudioDuration } from '../audioUtils';

interface SynthesisStatusProps {
  isPlaying: boolean;
  audioBuffer: AudioBuffer | null;
  stopAudio: () => void;
  handleDownload: () => void;
  speedFactor: number;
}

const WAVE_BARS = [26, 52, 38, 68, 44, 76, 58, 70, 42, 62, 34, 50];

const SynthesisStatus: React.FC<SynthesisStatusProps> = ({
  isPlaying,
  audioBuffer,
  stopAudio,
  handleDownload,
  speedFactor,
}) => {
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  useEffect(() => {
    if (!audioBuffer) {
      setPreviewUrl(null);
      setIsPreviewPlaying(false);
      return;
    }

    const wavBlob = audioBufferToWavBlob(audioBuffer);
    const objectUrl = URL.createObjectURL(wavBlob);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [audioBuffer]);

  useEffect(() => {
    if (!previewAudioRef.current) {
      return;
    }
    previewAudioRef.current.playbackRate = speedFactor;
  }, [previewUrl, speedFactor]);

  const hasAudio = Boolean(audioBuffer && previewUrl);
  const isActive = isPlaying || isPreviewPlaying;
  const audioMeta = useMemo(() => {
    if (!audioBuffer) {
      return [];
    }

    return [
      { label: '时长', value: formatAudioDuration(audioBuffer.duration) },
      { label: '采样率', value: `${Math.round(audioBuffer.sampleRate / 1000)}kHz` },
      { label: '声道', value: `${audioBuffer.numberOfChannels}` },
      { label: '语速', value: `${speedFactor.toFixed(2)}x` },
    ];
  }, [audioBuffer, speedFactor]);

  const handlePreviewPlay = () => {
    stopAudio();
    setIsPreviewPlaying(true);
  };

  const handlePreviewPause = () => {
    setIsPreviewPlaying(false);
  };

  const handleStopPlayback = () => {
    stopAudio();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setIsPreviewPlaying(false);
  };

  return (
    <div className="theme-section flex-1 rounded-[32px] p-6 flex flex-col gap-5 min-h-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="theme-kicker text-[10px] font-black uppercase tracking-widest">音频预览</div>
          <div className="theme-title mt-2 text-xl font-black">合成结果</div>
          <div className="theme-subtitle mt-2 text-sm leading-6">
            {hasAudio ? '结果已生成，可直接预览或下载。' : '完成一次合成后，这里会显示可播放的语音结果。'}
          </div>
        </div>
        <div
          className={[
            'shrink-0 rounded-full px-3 py-1 text-[11px] font-black tracking-wide',
            isActive
              ? 'theme-section-warning text-[var(--color-amber-700)]'
              : hasAudio
              ? 'theme-section-success text-[var(--color-success-600)]'
              : 'theme-section-soft theme-kicker',
          ].join(' ')}
        >
          {isActive ? '播放中' : hasAudio ? '已就绪' : '等待音频'}
        </div>
      </div>

      {hasAudio ? (
        <div className="flex flex-wrap gap-2">
          {audioMeta.map((item) => (
            <div
              key={item.label}
              className="theme-section-soft rounded-full px-3 py-1.5 text-xs font-bold text-[var(--color-text-secondary)]"
            >
              {item.label} {item.value}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex-1 min-h-0 rounded-[28px] border border-[var(--color-border-soft)] bg-[rgba(243,246,248,0.84)] px-5 py-6">
        {hasAudio ? (
          <div className="flex h-full min-h-[280px] flex-col justify-center gap-6">
            <div className="flex items-end justify-center gap-2">
              {WAVE_BARS.map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className={[
                    'w-2 rounded-full transition-all duration-300',
                    isActive ? 'bg-[var(--color-amber-400)] animate-waveform' : 'bg-[rgba(214,168,74,0.5)]',
                  ].join(' ')}
                  style={{
                    height: `${height}px`,
                    animationDelay: `${index * 0.08}s`,
                  }}
                />
              ))}
            </div>

            <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
              <div className="theme-subtitle flex items-center gap-2 text-sm font-bold">
                <AudioLines className="h-4 w-4" />
                音频播放器
              </div>
              <audio
                ref={previewAudioRef}
                controls
                src={previewUrl ?? undefined}
                className="w-full"
                onPlay={handlePreviewPlay}
                onPause={handlePreviewPause}
                onEnded={handlePreviewPause}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 text-center">
            <div className="theme-section-soft flex h-16 w-16 items-center justify-center rounded-2xl">
              <Activity className="h-7 w-7 text-[var(--color-gray-400)]" />
            </div>
            <div>
              <div className="theme-title text-base font-black">等待音频</div>
              <div className="theme-subtitle mt-2 text-sm leading-6">
                左侧完成文本合成后，这里会出现可预览的语音内容。
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleStopPlayback}
          disabled={!hasAudio || !isActive}
          className={`w-full rounded-2xl py-4 text-sm font-black transition-all ${
            !hasAudio || !isActive
              ? 'theme-button-disabled'
              : 'theme-button-secondary hover:border-[var(--color-amber-400)] hover:bg-[rgba(255,237,201,0.58)]'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Square className="h-4 w-4 fill-current" />
            停止播放
          </span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!hasAudio}
          className={`w-full rounded-2xl py-4 text-sm font-black transition-all ${
            !hasAudio ? 'theme-button-disabled' : 'theme-button-amber'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            下载音频
          </span>
        </button>
      </div>
    </div>
  );
};

export default SynthesisStatus;
