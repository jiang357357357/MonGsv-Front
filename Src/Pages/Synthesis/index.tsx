import React, { useEffect, useRef, useState } from 'react';
import { Layers, Globe, AlertCircle } from 'lucide-react';
import { synthesizeByRoleEmotion } from './Services/ttsService';
import { getVersions, getCharacters, getEmotions } from './Services/infoService';
import { useAudioPlayer } from './hooks';
import { VersionInfo, EmotionInfo } from './types';
import { RoleInfo, WorldInfo } from '../Management/types';
import { fetchWorlds } from '../Management/Services/managementApi';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import CustomSelect from '../Emotion/Components/CustomSelect';
import { AppView } from '../../types';

// New Components
import SynthesisConfig from './Components/SynthesisConfig';
import SynthesisInput from './Components/SynthesisInput';
import SynthesisStatus from './Components/SynthesisStatus';
import SynthesisAdvanced, { samplingDefaults, SynthesisAdvancedSettings } from './Components/SynthesisAdvanced';
import { audioBufferToWavBlob } from './audioUtils';

const SynthesisView: React.FC = () => {
  // Data from API
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [characters, setCharacters] = useState<RoleInfo[]>([]);
  const [emotions, setEmotions] = useState<EmotionInfo[]>([]);
  
  // Loading states
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [isLoadingWorlds, setIsLoadingWorlds] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLoadingEmotions, setIsLoadingEmotions] = useState(false);
  
  // State for Selection
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedWorldId, setSelectedWorldId] = useState<number | ''>('');
  const [selectedCharacterName, setSelectedCharacterName] = useState<string>('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState('中文');
  const [selectedCutMethod, setSelectedCutMethod] = useState('按标点符号切');
  const [selectedInferenceMode, setSelectedInferenceMode] = useState('normal');
  const [speedFactor, setSpeedFactor] = useState(1.0);
  const [advanced, setAdvanced] = useState<SynthesisAdvancedSettings>({
    useModelDefaults: true, ...samplingDefaults(''), seed: -1,
    topK: 15, topP: 1, temperature: 1, pauseSecond: 0.3,
  });
  const [result, setResult] = useState<{ character: string; emotion: string; version: string; speed: number; seed: number } | null>(null);
  
  const [text, setText] = useState('你好，这是一段测试文本');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState('等待模型');

  const charactersRequestRef = useRef(0);
  const emotionsRequestRef = useRef(0);

  const { isPlaying, audioBuffer, setAudioBuffer, playAudio, stopAudio } = useAudioPlayer();
  const selectedRole = characters.find((character) => character.name === selectedCharacterName) || null;

  // Start with an available model and its world, preferring Turbo when installed.
  useEffect(() => {
    let cancelled = false;
    const loadCatalog = async () => {
      setIsLoadingVersions(true);
      setIsLoadingWorlds(true);
      try {
        const [versionList, worldList, roleList] = await Promise.all([
          getVersions(), fetchWorlds(), getCharacters(),
        ]);
        if (cancelled) return;
        setVersions(versionList.map(version => ({ id: version, name: version })));
        setWorlds(worldList);
        const readyRoles = roleList.filter(role => role.gpt_model_path && role.sov_model_path
          && versionList.includes(role.version || '') && worldList.some(world => world.id === role.world_id));
        const preferred = readyRoles.find(role => role.version === 'v5turbo') || readyRoles[0];
        setSelectedVersionId(preferred?.version || versionList[0] || '');
        setSelectedWorldId(preferred?.world_id ?? worldList[0]?.id ?? '');
        setSelectedCharacterName(preferred?.name || '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载模型列表失败');
      } finally {
        if (!cancelled) {
          setIsLoadingVersions(false);
          setIsLoadingWorlds(false);
        }
      }
    };
    void loadCatalog();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setAdvanced(previous => ({ ...previous, ...samplingDefaults(selectedVersionId) }));
  }, [selectedVersionId]);

  // Load characters when world or version changes
  useEffect(() => {
    const requestId = ++charactersRequestRef.current;
    if (!selectedVersionId || selectedWorldId === '') {
      setIsLoadingCharacters(false);
      setCharacters([]);
      setSelectedCharacterName('');
      setEmotions([]);
      setSelectedEmotion('');
      return;
    }

    const loadCharacters = async () => {
      setIsLoadingCharacters(true);
      setError(null);
      try {
        const characterList = await getCharacters(selectedVersionId, Number(selectedWorldId));
        if (requestId !== charactersRequestRef.current) {
          return;
        }
        setCharacters(characterList);

        setSelectedCharacterName((prev) => {
          if (characterList.length === 0) {
            return '';
          }
          return characterList.some((character) => character.name === prev) ? prev : characterList[0].name;
        });

        if (characterList.length === 0) {
          setSelectedCharacterName('');
          setEmotions([]);
          setSelectedEmotion('');
        }
      } catch (err) {
        if (requestId !== charactersRequestRef.current) {
          return;
        }
        const errorMessage = err instanceof Error ? err.message : '加载角色列表失败';
        setError(errorMessage);
        console.error('加载角色列表失败:', err);
        setCharacters([]);
      } finally {
        if (requestId === charactersRequestRef.current) {
          setIsLoadingCharacters(false);
        }
      }
    };

    void loadCharacters();
    return () => { ++charactersRequestRef.current; };
  }, [selectedVersionId, selectedWorldId]);

  // Load emotions when character changes
  useEffect(() => {
    const requestId = ++emotionsRequestRef.current;
    if (!selectedVersionId || !selectedCharacterName || !selectedRole) {
      setIsLoadingEmotions(false);
      setEmotions([]);
      setSelectedEmotion('');
      return;
    }

    const loadEmotions = async () => {
      setIsLoadingEmotions(true);
      setError(null);
      try {
        const emotionList = await getEmotions(selectedRole.id);
        if (requestId !== emotionsRequestRef.current) {
          return;
        }
        setEmotions(emotionList);

        setSelectedEmotion((prev) => {
          if (emotionList.length === 0) {
            return '';
          }
          return emotionList.some((emotion) => emotion.name === prev) ? prev : emotionList[0].name;
        });
      } catch (err) {
        if (requestId !== emotionsRequestRef.current) {
          return;
        }
        const errorMessage = err instanceof Error ? err.message : '加载情感列表失败';
        setError(errorMessage);
        setEmotions([]);
        setSelectedEmotion('');
      } finally {
        if (requestId === emotionsRequestRef.current) {
          setIsLoadingEmotions(false);
        }
      }
    };

    void loadEmotions();
    return () => { ++emotionsRequestRef.current; };
  }, [selectedVersionId, selectedCharacterName, selectedRole?.id]);

  useEffect(() => {
    if (!selectedRole) {
      setModelStatus('等待模型');
      return;
    }
    setModelStatus('待加载');
  }, [selectedRole]);

  const isReady = Boolean(selectedRole && selectedEmotion && !isLoadingCharacters && !isLoadingEmotions
    && selectedRole.version === selectedVersionId && selectedRole.world_id === selectedWorldId
    && emotions.some(emotion => emotion.name === selectedEmotion));

  const handleGenerate = async () => {
    if (isProcessing || !isReady) return;
    if (!text.trim()) {
      setError('请输入要合成的文本');
      return;
    }
    
    if (!selectedVersionId) {
      setError('请选择版本');
      return;
    }
    
    if (!selectedCharacterName) {
      setError('请选择角色');
      return;
    }
    
    if (!selectedRole) {
      setError('未找到当前角色信息');
      return;
    }

    if (!selectedEmotion) {
      setError('请选择情感');
      return;
    }

    const supportsSteps = ['v3', 'v4', 'v5dev', 'v5turbo'].includes(selectedVersionId);
    const isV5 = selectedVersionId === 'v5dev' || selectedVersionId === 'v5turbo';
    if (!Number.isInteger(advanced.seed) || advanced.seed < -1 || advanced.seed > 4294967295) {
      setError('随机种子必须是 -1 或 0 至 4294967295 的整数');
      return;
    }
    if ((supportsSteps && !advanced.useModelDefaults
      && (!Number.isInteger(advanced.sampleSteps) || advanced.sampleSteps < 1 || advanced.sampleSteps > 128))
      || (isV5 && !advanced.useModelDefaults && (advanced.cfgRate < 0 || advanced.cfgRate > 10))
      || !Number.isInteger(advanced.topK) || advanced.topK < 1 || advanced.topK > 100
      || advanced.topP <= 0 || advanced.topP > 1 || advanced.temperature <= 0 || advanced.temperature > 2
      || advanced.pauseSecond < 0 || advanced.pauseSecond > 5) {
      setError('请检查高级参数：步数 1–128，CFG 0–10，Top K 1–100，Top P 0–1（不含 0），温度 0–2（不含 0），停顿 0–5 秒');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setAudioBuffer(null);
    setResult(null);
    stopAudio();

    try {
      setModelStatus('后端准备模型');

      const buffer = await synthesizeByRoleEmotion({
        role_id: selectedRole.id,
        world_id: selectedWorldId === '' ? undefined : Number(selectedWorldId),
        version: selectedVersionId,
        emotion: selectedEmotion,
        text: text.trim(),
        text_language: selectedLang,
        speed: speedFactor,
        how_to_cut: selectedCutMethod,
        inference_mode: selectedInferenceMode,
        seed: advanced.seed,
        top_k: advanced.topK,
        top_p: advanced.topP,
        temperature: advanced.temperature,
        pause_second: advanced.pauseSecond,
        // Omit these values to preserve the installed model's defaults.
        ...(supportsSteps && !advanced.useModelDefaults ? { sample_steps: advanced.sampleSteps } : {}),
        ...(isV5 && !advanced.useModelDefaults ? { cfg_rate: advanced.cfgRate } : {}),
      });
      
      setModelStatus('模型已就绪');
      setAudioBuffer(buffer);
      setResult({ character: selectedRole.name, emotion: selectedEmotion,
        version: selectedVersionId, speed: speedFactor, seed: advanced.seed });
      await playAudio(buffer);

    } catch (error) {
      console.error('TTS合成错误:', error);
      const errorMessage = error instanceof Error ? error.message : '合成失败，请检查网络连接和API配置';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!audioBuffer) return;

    const blob = audioBufferToWavBlob(audioBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tts_${result?.character || selectedCharacterName}_${result?.emotion || selectedEmotion}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      currentView={AppView.SYNTHESIS}
      title="语音合成工坊"
      hideHeader
    >
      <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
        {/* LEFT: Configuration & Input (8 Cols) */}
        <div className="theme-section col-span-1 md:col-span-8 rounded-3xl p-6 lg:p-8 flex flex-col gap-5 tech-border relative min-h-0 overflow-y-auto">
          <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CustomSelect
              label="模型版本"
              icon={<Layers className="theme-accent-icon w-4 h-4" />}
              value={selectedVersionId}
              options={versions}
              onChange={setSelectedVersionId}
              isLoading={isLoadingVersions}
              disabled={isProcessing}
              placeholder="选择版本"
              variant="filled"
            />
            <CustomSelect
              label="所属世界"
              icon={<Globe className="theme-info-text w-4 h-4" />}
              value={selectedWorldId.toString()}
              options={worlds.map(w => ({ id: w.id.toString(), name: w.name }))}
              onChange={(val) => setSelectedWorldId(Number(val))}
              disabled={isProcessing || !selectedVersionId}
              isLoading={isLoadingWorlds}
              placeholder={!selectedVersionId ? "请先选择版本" : "选择世界"}
              variant="filled"
            />
          </div>

          <div className="relative z-20">
            <SynthesisConfig
              selectedCharacterName={selectedCharacterName}
              setSelectedCharacterName={setSelectedCharacterName}
              characters={characters.map((character) => character.name)}
              isLoadingCharacters={isLoadingCharacters}
              selectedWorldId={selectedWorldId}
              selectedLang={selectedLang}
              setSelectedLang={setSelectedLang}
              selectedCutMethod={selectedCutMethod}
              setSelectedCutMethod={setSelectedCutMethod}
              selectedInferenceMode={selectedInferenceMode}
              setSelectedInferenceMode={setSelectedInferenceMode}
              selectedEmotion={selectedEmotion}
              setSelectedEmotion={setSelectedEmotion}
              emotions={emotions}
              isLoadingEmotions={isLoadingEmotions}
              speedFactor={speedFactor}
              setSpeedFactor={setSpeedFactor}
              disabled={isProcessing}
            />
          </div>

          <SynthesisAdvanced version={selectedVersionId} value={advanced}
            onChange={setAdvanced} disabled={isProcessing} />

          <div className="relative z-10 flex-1 flex flex-col min-h-[200px]">
            <SynthesisInput
              text={text}
              setText={setText}
              isProcessing={isProcessing}
              isReady={isReady}
              selectedEmotion={selectedEmotion}
              handleGenerate={handleGenerate}
            />
          </div>
        </div>

        {/* RIGHT: Status & Output (4 Cols) */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6 min-h-0">
          <div className="theme-section rounded-[32px] px-6 py-5 shrink-0">
            <div className="theme-kicker text-[10px] font-black uppercase tracking-widest">推理模型</div>
            <div className="mt-2 text-sm font-bold">{modelStatus}</div>
            <div className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">
              {selectedRole ? `${selectedRole.name} / ${selectedRole.version || selectedVersionId}` : '请选择角色'}
            </div>
          </div>

          <SynthesisStatus
            isPlaying={isPlaying}
            audioBuffer={audioBuffer}
            stopAudio={stopAudio}
            handleDownload={handleDownload}
            speedFactor={result?.speed ?? speedFactor}
            resultLabel={result ? `${result.character} / ${result.emotion} / ${result.version} · ${result.seed === -1 ? '随机种子' : `种子 ${result.seed}`}` : undefined}
          />

          {/* Error Message */}
          {error && (
            <div className="theme-status-block-danger rounded-[32px] p-6 flex gap-4 animate-shake shrink-0">
              <div className="theme-status-block-danger p-2 rounded-xl shrink-0 h-fit">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-widest">系统异常 / EXCEPTION</h4>
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SynthesisView;
