// 从后端获取的情感信息
export interface EmotionInfo {
  emotion: string;
  text: string;
  audio_files: string[];
  text_language?: string;
}
