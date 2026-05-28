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
  const [selectedCutMethod, setSelectedCutMethod] = useState('凑四句一切');
  const [selectedInferenceMode, setSelectedInferenceMode] = useState('normal');
  const [speedFactor, setSpeedFactor] = useState(1.0);
  
  const [text, setText] = useState('你好，这是一段测试文本');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState('等待模型');

  const worldsRequestRef = useRef(0);
  const charactersRequestRef = useRef(0);
  const emotionsRequestRef = useRef(0);

  const { isPlaying, audioBuffer, setAudioBuffer, playAudio, stopAudio } = useAudioPlayer();
  const selectedRole = characters.find((character) => character.name === selectedCharacterName) || null;

  // Load versions on mount
  useEffect(() => {
    const loadVersions = async () => {
      setIsLoadingVersions(true);
      setError(null);
      try {
        const versionList = await getVersions();
        const versionInfos: VersionInfo[] = versionList.map(v => ({
          id: v,
          name: v,
        }));
        setVersions(versionInfos);
        
        // Auto-select first version
        if (versionInfos.length > 0) {
          setSelectedVersionId(versionInfos[0].id);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载版本列表失败';
        setError(errorMessage);
        console.error('加载版本列表失败:', err);
      } finally {
        setIsLoadingVersions(false);
      }
    };
    
    loadVersions();
  }, []);

  // Load worlds once; the list itself is not version-specific.
  useEffect(() => {
    const loadWorlds = async () => {
      const requestId = ++worldsRequestRef.current;
      setIsLoadingWorlds(true);
      setError(null);
      try {
        const worldList = await fetchWorlds();
        if (requestId !== worldsRequestRef.current) {
          return;
        }
        setWorlds(worldList);

        setSelectedWorldId((prev) => {
          if (worldList.length === 0) {
            return '';
          }
          const stillExists = worldList.some((world) => world.id === prev);
          return stillExists ? prev : worldList[0].id;
        });

        if (worldList.length === 0) {
          setSelectedWorldId('');
          setCharacters([]);
          setSelectedCharacterName('');
          setEmotions([]);
          setSelectedEmotion('');
        }
      } catch (err) {
        if (requestId !== worldsRequestRef.current) {
          return;
        }
        const errorMessage = err instanceof Error ? err.message : '加载世界列表失败';
        setError(errorMessage);
        console.error('加载世界列表失败:', err);
        setWorlds([]);
      } finally {
        if (requestId === worldsRequestRef.current) {
          setIsLoadingWorlds(false);
        }
      }
    };

    void loadWorlds();
  }, []);

  // Load characters when world or version changes
  useEffect(() => {
    if (!selectedVersionId || selectedWorldId === '') {
      setCharacters([]);
      setSelectedCharacterName('');
      setEmotions([]);
      setSelectedEmotion('');
      return;
    }

    const loadCharacters = async () => {
      const requestId = ++charactersRequestRef.current;
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
  }, [selectedVersionId, selectedWorldId]);

  // Load emotions when character changes
  useEffect(() => {
    if (!selectedVersionId || !selectedCharacterName || !selectedRole) {
      setEmotions([]);
      setSelectedEmotion('');
      return;
    }

    const loadEmotions = async () => {
      const requestId = ++emotionsRequestRef.current;
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
  }, [selectedVersionId, selectedCharacterName, selectedRole?.id]);

  useEffect(() => {
    if (!selectedRole) {
      setModelStatus('等待模型');
      return;
    }
    setModelStatus('待加载');
  }, [selectedRole]);

  const handleGenerate = async () => {
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

    setIsProcessing(true);
    setError(null);
    setAudioBuffer(null);
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
        use_cuda_graph: selectedInferenceMode !== 'normal',
        cuda_graph_mode: selectedInferenceMode === 'decoder_only' ? 'decoder_only' : 'graph',
      });
      
      setModelStatus('模型已就绪');
      setAudioBuffer(buffer);
      await playAudio(buffer, speedFactor);

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
    a.download = `tts_${selectedCharacterName}_${selectedEmotion}_${Date.now()}.wav`;
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
        <div className="theme-section col-span-1 md:col-span-8 rounded-3xl p-8 flex flex-col gap-6 tech-border relative min-h-0">
          <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CustomSelect
              label="模型版本"
              icon={<Layers className="theme-accent-icon w-4 h-4" />}
              value={selectedVersionId}
              options={versions}
              onChange={setSelectedVersionId}
              isLoading={isLoadingVersions}
              placeholder="选择版本"
              variant="filled"
            />
            <CustomSelect
              label="所属世界"
              icon={<Globe className="theme-info-text w-4 h-4" />}
              value={selectedWorldId.toString()}
              options={worlds.map(w => ({ id: w.id.toString(), name: w.name }))}
              onChange={(val) => setSelectedWorldId(Number(val))}
              disabled={!selectedVersionId}
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
            />
          </div>

          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            <SynthesisInput
              text={text}
              setText={setText}
              isProcessing={isProcessing}
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
            speedFactor={speedFactor}
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

