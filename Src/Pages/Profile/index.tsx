import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  CircleAlert,
  CircleCheck,
  Fingerprint,
  Gauge,
  Languages,
  LoaderCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import { AppView } from '../../../types';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import {
  fetchRegisteredSpeakers,
  registerVoiceprint,
  unregisterVoiceprint,
} from './Services/profileService';
import {
  Feedback,
  PersonalProfile,
  ProfileTab,
  RegisteredSpeaker,
} from './types';
import './profile-settings.css';

const STORAGE_KEY = 'monGsvPersonalProfile';

const DEFAULT_PROFILE: PersonalProfile = {
  speakerId: '',
  displayName: '',
  language: 'zh',
  voiceprintThreshold: 0.75,
};

const readStoredProfile = (): PersonalProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const stored = JSON.parse(raw) as Partial<PersonalProfile>;
    return {
      speakerId: String(stored.speakerId || ''),
      displayName: String(stored.displayName || ''),
      language: ['auto', 'zh', 'en', 'ja'].includes(String(stored.language))
        ? (stored.language as PersonalProfile['language'])
        : 'zh',
      voiceprintThreshold: Math.min(0.95, Math.max(0.5, Number(stored.voiceprintThreshold) || 0.75)),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
};

const ProfileSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [profile, setProfile] = useState<PersonalProfile>(readStoredProfile);
  const [savedProfile, setSavedProfile] = useState<PersonalProfile>(readStoredProfile);
  const [speakers, setSpeakers] = useState<RegisteredSpeaker[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSpeaker = useMemo(
    () => speakers.find((speaker) => speaker.speaker_id === savedProfile.speakerId) || null,
    [savedProfile.speakerId, speakers],
  );

  const refreshSpeakers = useCallback(async (showSuccess = false) => {
    setIsLoadingStatus(true);
    try {
      setSpeakers(await fetchRegisteredSpeakers());
      if (showSuccess) setFeedback({ kind: 'success', message: '声纹状态已刷新。' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : '获取声纹状态失败。',
      });
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void refreshSpeakers();
  }, [refreshSpeakers]);

  const updateProfile = <K extends keyof PersonalProfile>(key: K, value: PersonalProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  };

  const saveProfile = () => {
    const normalized = {
      ...profile,
      speakerId: profile.speakerId.trim(),
      displayName: profile.displayName.trim(),
      voiceprintThreshold: Math.min(0.95, Math.max(0.5, profile.voiceprintThreshold)),
    };
    if (!normalized.speakerId || !normalized.displayName) {
      setFeedback({ kind: 'error', message: '请填写用户标识和显示名称。' });
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setProfile(normalized);
    setSavedProfile(normalized);
    setFeedback({ kind: 'success', message: '个人配置已保存到当前浏览器。' });
  };

  const selectAudioFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.(wav|mp3|m4a|flac|ogg|aac)$/i.test(file.name)) {
      setFeedback({ kind: 'error', message: '请选择有效的音频文件。' });
      return;
    }
    setAudioFile(file);
    setFeedback({ kind: 'info', message: `已选择 ${file.name}` });
  };

  const handleRegister = async () => {
    if (!savedProfile.speakerId || !savedProfile.displayName) {
      setFeedback({ kind: 'error', message: '请先在“个人资料”中保存用户标识和显示名称。' });
      setActiveTab('profile');
      return;
    }
    if (!audioFile) {
      setFeedback({ kind: 'error', message: '请先选择一段清晰的个人语音。' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerVoiceprint(
        audioFile,
        savedProfile.speakerId,
        savedProfile.displayName,
      );
      await refreshSpeakers();
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedback({ kind: 'success', message: result.message || '声纹注册成功。' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : '声纹注册失败。',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    if (!currentSpeaker) return;
    if (!window.confirm(`确认注销 ${currentSpeaker.name} 的声纹吗？注销后语音识别门禁将拒绝该用户。`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await unregisterVoiceprint(currentSpeaker.speaker_id);
      await refreshSpeakers();
      setFeedback({ kind: 'success', message: result.message || '声纹已注销。' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : '注销声纹失败。',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: '个人资料', hint: '身份 + 偏好', icon: UserRound },
    { id: 'voiceprint' as const, label: '声纹配置', hint: '注册 + 状态', icon: Fingerprint },
  ];

  const feedbackClass = feedback?.kind === 'error'
    ? 'theme-status-block-danger'
    : feedback?.kind === 'success'
      ? 'theme-status-block-success'
      : 'theme-status-block-info';

  const renderProfile = () => (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.35fr]">
      <section className="profile-panel rounded-2xl p-6">
        <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
          <div className="theme-nav-icon flex h-16 w-16 items-center justify-center rounded-2xl">
            <UserRound className="h-8 w-8" />
          </div>
          <h3 className="theme-title mt-5 text-xl font-black">
            {savedProfile.displayName || '尚未配置用户'}
          </h3>
          <p className="theme-subtitle mt-2 text-sm">
            {savedProfile.speakerId || '保存个人资料后生成用户身份'}
          </p>
          <div className={`mt-5 rounded-full px-4 py-2 text-xs font-bold ${
            currentSpeaker ? 'theme-status-block-success' : 'theme-status-block-warning'
          }`}>
            {isLoadingStatus ? '正在检查声纹状态' : currentSpeaker ? '声纹已注册' : '声纹未注册'}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <section className="profile-panel rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <UserRound className="theme-info-text h-5 w-5" />
            <h3 className="theme-title text-lg font-black">身份信息</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="theme-title mb-2 block text-sm font-bold">用户标识</span>
              <input
                className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                value={profile.speakerId}
                onChange={(event) => updateProfile('speakerId', event.target.value)}
                placeholder="例如：user-001"
              />
              <span className="theme-subtitle mt-2 block text-xs">同时作为语音识别使用的 speaker_id</span>
            </label>
            <label className="block">
              <span className="theme-title mb-2 block text-sm font-bold">显示名称</span>
              <input
                className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                value={profile.displayName}
                onChange={(event) => updateProfile('displayName', event.target.value)}
                placeholder="例如：Manager"
              />
              <span className="theme-subtitle mt-2 block text-xs">用于页面展示和声纹记录名称</span>
            </label>
          </div>
        </section>

        <section className="profile-panel rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <Gauge className="theme-accent-text h-5 w-5" />
            <h3 className="theme-title text-lg font-black">识别偏好</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="profile-panel-soft flex items-center gap-4 rounded-xl p-4">
              <Languages className="theme-info-text h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="theme-title block text-sm font-bold">默认识别语言</span>
                <select
                  className="theme-input mt-2 w-full rounded-lg px-3 py-2 text-sm"
                  value={profile.language}
                  onChange={(event) => updateProfile('language', event.target.value as PersonalProfile['language'])}
                >
                  <option value="auto">自动识别</option>
                  <option value="zh">中文</option>
                  <option value="en">英语</option>
                  <option value="ja">日语</option>
                </select>
              </span>
            </label>
            <label className="profile-panel-soft flex items-center gap-4 rounded-xl p-4">
              <ShieldCheck className="theme-accent-text h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="theme-title flex items-center justify-between text-sm font-bold">
                  声纹匹配阈值
                  <strong>{profile.voiceprintThreshold.toFixed(2)}</strong>
                </span>
                <input
                  className="mt-3 w-full accent-blue-500"
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.01"
                  value={profile.voiceprintThreshold}
                  onChange={(event) => updateProfile('voiceprintThreshold', Number(event.target.value))}
                />
              </span>
            </label>
          </div>
        </section>

        <button
          type="button"
          onClick={saveProfile}
          className="theme-button-amber flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-black"
        >
          <Save className="h-5 w-5" />
          保存个人配置
        </button>
      </div>
    </div>
  );

  const renderVoiceprint = () => (
    <div className="grid gap-4 xl:grid-cols-[0.78fr_1.4fr]">
      <section className="profile-panel rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="theme-info-text h-5 w-5" />
            <h3 className="theme-title text-lg font-black">当前声纹</h3>
          </div>
          <button
            type="button"
            onClick={() => void refreshSpeakers(true)}
            disabled={isLoadingStatus}
            className="theme-button-secondary rounded-lg p-2"
            title="刷新声纹状态"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="profile-panel-soft mt-5 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              currentSpeaker ? 'theme-status-block-success' : 'theme-status-block-warning'
            }`}>
              {currentSpeaker ? <CircleCheck className="h-6 w-6" /> : <CircleAlert className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <p className="theme-title font-black">
                {currentSpeaker ? '已注册' : '尚未注册'}
              </p>
              <p className="theme-subtitle mt-1 break-all text-sm">
                {savedProfile.speakerId || '请先保存用户标识'}
              </p>
            </div>
          </div>
          <dl className="theme-divider mt-5 space-y-3 border-t pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="theme-subtitle">显示名称</dt>
              <dd className="theme-title font-bold">{currentSpeaker?.name || savedProfile.displayName || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="theme-subtitle">注册时间</dt>
              <dd className="theme-title text-right font-bold">{currentSpeaker?.registered_at || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="theme-subtitle">匹配阈值</dt>
              <dd className="theme-title font-bold">{savedProfile.voiceprintThreshold.toFixed(2)}</dd>
            </div>
          </dl>
        </div>

        <button
          type="button"
          onClick={() => void handleUnregister()}
          disabled={!currentSpeaker || isSubmitting}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
            !currentSpeaker || isSubmitting ? 'theme-button-disabled' : 'theme-button-danger-ghost theme-card'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          注销当前声纹
        </button>
      </section>

      <section className="profile-panel flex min-h-[390px] flex-col rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <AudioLines className="theme-accent-text h-5 w-5" />
          <h3 className="theme-title text-lg font-black">
            {currentSpeaker ? '更新声纹样本' : '注册声纹样本'}
          </h3>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg,.aac"
          className="hidden"
          onChange={(event) => selectAudioFile(event.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectAudioFile(event.dataTransfer.files?.[0] || null);
          }}
          className={`profile-upload-zone mt-5 flex flex-1 flex-col items-center justify-center rounded-2xl p-8 text-center transition-colors ${
            isDragging ? 'profile-upload-zone-active' : ''
          }`}
        >
          <div className="theme-nav-icon flex h-16 w-16 items-center justify-center rounded-2xl">
            <Upload className="h-7 w-7" />
          </div>
          <h4 className="theme-title mt-5 text-xl font-black">
            {audioFile ? audioFile.name : '选择或拖入个人语音'}
          </h4>
          <p className="theme-subtitle mt-2 max-w-md text-sm leading-6">
            建议使用安静环境下 5–15 秒、仅包含本人声音的清晰音频。重新注册会更新现有声纹。
          </p>
          {audioFile ? (
            <span className="theme-tag mt-4 rounded-full px-4 py-2 text-xs font-bold">
              {(audioFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => void handleRegister()}
          disabled={isSubmitting || !audioFile || !savedProfile.speakerId}
          className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-black ${
            isSubmitting || !audioFile || !savedProfile.speakerId ? 'theme-button-disabled' : 'theme-button-amber'
          }`}
        >
          {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
          {isSubmitting ? '正在提取声纹…' : currentSpeaker ? '更新当前声纹' : '注册当前声纹'}
        </button>
      </section>
    </div>
  );

  return (
    <MainLayout
      currentView={AppView.PROFILE}
      title="个人配置"
      subtitle="管理当前用户身份、识别偏好与声纹门禁。"
      hideHeader
      contentClassName="min-h-0"
    >
      <div className="profile-workbench flex min-h-0 flex-col pb-4">
        <div className="relative z-10 flex flex-wrap items-end gap-2 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setFeedback(null); }}
                className={`profile-tab min-w-[170px] rounded-t-2xl border border-b-0 px-4 py-3 text-left transition-all ${
                  active ? 'profile-tab-active translate-y-px' : 'opacity-95 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="theme-nav-icon mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="theme-title block text-sm font-black">{tab.label}</span>
                    <span className="theme-subtitle mt-1 block text-[11px]">{tab.hint}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <section className="profile-page-surface -mt-px rounded-2xl border p-5">
          {feedback ? (
            <div className={`${feedbackClass} mb-4 rounded-xl px-4 py-3 text-sm font-bold`}>
              {feedback.message}
            </div>
          ) : null}
          {activeTab === 'profile' ? renderProfile() : renderVoiceprint()}
        </section>
      </div>
    </MainLayout>
  );
};

export default ProfileSettings;
