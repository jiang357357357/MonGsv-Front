export type ProfileTab = 'profile' | 'voiceprint' | 'test';

export interface PersonalProfile {
  displayName: string;
  language: 'auto' | 'zh' | 'en' | 'ja';
  voiceprintThreshold: number;
}

export interface RegisteredSpeaker {
  speaker_id: string;
  name: string;
  registered_at: string;
}

export interface SpeakerListResponse {
  success: boolean;
  speakers: RegisteredSpeaker[];
  count: number;
}

export interface SpeakerMutationResponse {
  success: boolean;
  message: string;
  speaker_id?: string;
}

export interface VoiceprintTestResult {
  speaker_id: string | null;
  name: string;
  similarity: number;
  is_known: boolean;
}

export interface VoiceprintTestResponse {
  success: boolean;
  result: VoiceprintTestResult;
}

export type Feedback = {
  kind: 'success' | 'error' | 'info';
  message: string;
} | null;
