import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { createLogger } from '../../../../System/Log/logger';

const logger = createLogger('pages/emotion', 'AudioPlayer');

interface AudioPlayerProps {
  src: string | null;
  fileName?: string;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  fileName,
  onEnded,
  onError,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 初始化音频元素
  useEffect(() => {
    if (!src) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(false);
      return;
    }

    // 创建音频元素
    const audio = new Audio(src);
    audioRef.current = audio;
    
    // 设置属性
    audio.preload = 'auto';
    audio.volume = isMuted ? 0 : volume;

    // 事件监听
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      logger.debug('音频元数据加载成功', { duration: audio.duration });
    };

    const handleTimeUpdate = () => {
      // 确保时间更新到音频的实际当前时间
      const time = audio.currentTime;
      setCurrentTime(time);
      
      // 如果接近结束（在最后0.1秒内），确保更新到结束时间
      if (audio.duration && time >= audio.duration - 0.1) {
        setCurrentTime(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // 播放结束时，将当前时间设置为总时长，确保进度条显示完整
      if (audio.duration) {
        setCurrentTime(audio.duration);
      } else {
        setCurrentTime(0);
      }
      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      setIsPlaying(false);
      setIsLoading(false);
      const error = audio.error;
      const errorMessage = error 
        ? `播放失败 (错误代码: ${error.code})`
        : '播放失败，请检查音频文件';
      
      logger.error('音频播放错误', {
        errorCode: error?.code,
        errorMessage: error?.message,
        src: audio.src,
      });
      
      if (onError) {
        onError(new Error(errorMessage));
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    // 使用 requestAnimationFrame 更频繁地更新进度，确保能播放到结束
    const updateProgress = () => {
      if (audio && !audio.paused && !audio.ended) {
        const time = audio.currentTime;
        setCurrentTime(time);
        
        // 如果接近结束，确保更新到结束时间
        if (audio.duration && time >= audio.duration - 0.05) {
          setCurrentTime(audio.duration);
        }
        
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    // 监听播放状态变化，启动/停止动画循环
    const handlePlay = () => {
      updateProgress();
    };

    const handlePause = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // 开始加载
    audio.load();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, [src, onEnded, onError, isMuted, volume]);

  // 更新音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = async () => {
    if (!audioRef.current || !src) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      logger.error('播放失败', { error });
      if (onError) {
        onError(error instanceof Error ? error : new Error('播放失败'));
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || !src) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current || !src) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    // 显示到秒，但保留更精确的计算
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercentage = isMuted ? 0 : Math.round(volume * 100);

  if (!src) {
    return (
      <div className={`theme-section-soft rounded-xl p-4 ${className}`}>
        <div className="theme-kicker flex items-center justify-center text-sm">
          暂无音频文件
        </div>
      </div>
    );
  }

  return (
    <div className={`theme-section rounded-xl p-4 ${className}`}>
      {/* File Name */}
      {fileName && (
        <div className="mb-3 text-center">
          <p className="theme-title text-sm font-bold truncate" title={fileName}>
            {fileName}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleSeek}
        className="relative h-2 bg-[var(--color-gray-200)] rounded-full cursor-pointer mb-3 group"
      >
        <div
          className="absolute left-0 top-0 h-full theme-amber-gradient rounded-full transition-all duration-100"
          style={{ width: `${progressPercentage}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[var(--color-amber-400)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          style={{ left: `calc(${progressPercentage}% - 8px)` }}
        />
      </div>

      {/* Time Display */}
      <div className="theme-subtitle flex items-center justify-between text-xs mb-3 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => skip(-10)}
            className="theme-button-secondary p-2 rounded-lg transition-colors"
            title="后退10秒"
            disabled={!src}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayPause}
            disabled={isLoading || !src}
            className="theme-button-amber p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={handleStop}
            className="theme-button-secondary p-2 rounded-lg transition-colors"
            title="停止"
            disabled={!src || (!isPlaying && currentTime === 0)}
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => skip(10)}
            className="theme-button-secondary p-2 rounded-lg transition-colors"
            title="前进10秒"
            disabled={!src}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 w-full max-w-[200px]">
          <button
            onClick={toggleMute}
            className="theme-button-secondary p-1.5 rounded-lg transition-colors shrink-0"
            title={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 accent-[var(--color-amber-400)] h-1.5 bg-[var(--color-gray-200)] rounded-lg appearance-none cursor-pointer"
            aria-label="音量控制"
          />
          <span className="theme-subtitle text-xs font-mono w-8 text-right">{volumePercentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
