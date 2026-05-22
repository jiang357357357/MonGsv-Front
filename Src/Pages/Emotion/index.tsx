import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Smile, Globe, Layers, User } from 'lucide-react';
import CustomSelect from './Components/CustomSelect';

import { 
  getRoleEmotions,
  getRoleWorkspaces,
  RoleWorkspaceInfo,
  saveRoleEmotion,
  deleteRoleEmotion,
} from './Services/emotionService';
import { EmotionInfo } from './types';
import { RoleInfo, WorldInfo } from '../Management/types';
import { fetchRolesByWorld, fetchWorlds } from '../Management/Services/managementApi';
import EmotionList from './Components/EmotionList';
import EmotionEditor from './Components/EmotionEditor';
import AddEmotionModal from './Components/AddEmotionModal';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import { createLogger } from '../../../System/Log/logger';
import { getApiBaseUrl } from '../../../System/Config';
import { AppView } from '../../types';

const logger = createLogger('pages/emotion', 'index');

const EmotionConfigView: React.FC = () => {
  // Data from API
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [characters, setCharacters] = useState<RoleInfo[]>([]);
  const [emotions, setEmotions] = useState<EmotionInfo[]>([]);
  const [roleWorkspaces, setRoleWorkspaces] = useState<RoleWorkspaceInfo[]>([]);
  
  // Loading states
  const [isLoadingWorlds, setIsLoadingWorlds] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLoadingEmotions, setIsLoadingEmotions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for Selection
  const [selectedWorldId, setSelectedWorldId] = useState<number | ''>('');
  const [selectedCharacterName, setSelectedCharacterName] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  
  // Editable State
  const [editText, setEditText] = useState('');
  const [editTextLanguage, setEditTextLanguage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  
  // Add New Emotion Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Current emotion info
  const currentEmotionInfo = emotions.find(e => e.emotion === selectedEmotion);
  const selectedRole = characters.find(
    (role) => role.name === selectedCharacterName && role.version === selectedVersionId,
  ) || null;
  const selectedWorld = worlds.find(w => w.id === selectedWorldId) || null;
  const selectedWorkspace = useMemo(() => {
    if (!selectedCharacterName || !selectedVersionId) {
      return null;
    }

    return roleWorkspaces.find((workspace) =>
      workspace.role_name === selectedCharacterName &&
      (workspace.world_name || '') === (selectedWorld?.name || '') &&
      (workspace.base_version || '') === selectedVersionId,
    ) || null;
  }, [roleWorkspaces, selectedCharacterName, selectedVersionId, selectedWorld?.name]);
  const availableRoles = useMemo(() => {
    const seen = new Set<string>();
    return characters.filter((role) => {
      if (seen.has(role.name)) {
        return false;
      }
      seen.add(role.name);
      return true;
    });
  }, [characters]);
  const availableVersions = useMemo(() => {
    const seen = new Set<string>();
    return characters
      .filter((role) => role.name === selectedCharacterName)
      .map((role) => role.version || '')
      .filter((version) => version.length > 0)
      .filter((version) => {
        if (seen.has(version)) {
          return false;
        }
        seen.add(version);
        return true;
      });
  }, [characters, selectedCharacterName]);

  // 组件挂载时输出日志
  useEffect(() => {
    logger.debug('🚀 情感配置页面组件已挂载');
    const currentBaseUrl = getApiBaseUrl();
    logger.debug('⚙️ 当前API配置', {
      'Base URL': currentBaseUrl,
      });
  }, []);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const workspaces = await getRoleWorkspaces();
        setRoleWorkspaces(workspaces);
      } catch (err) {
        logger.warn('加载角色工作区失败', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    loadWorkspaces();
  }, []);

  // Load worlds on mount
  useEffect(() => {
    const loadWorlds = async () => {
      setIsLoadingWorlds(true);
      setError(null);
      try {
        // 后端 fetchWorlds 暂时不支持 version 过滤，前端获取全部
        const worldList = await fetchWorlds();
        setWorlds(worldList);
        if (worldList.length > 0) {
          setSelectedWorldId((prev) => {
            const stillExists = worldList.some((world) => world.id === prev);
            return stillExists ? prev : worldList[0].id;
          });
        } else {
          setSelectedWorldId('');
          setCharacters([]);
          setSelectedCharacterName('');
          setSelectedVersionId('');
          setEmotions([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载世界列表失败';
        setError(errorMessage);
        console.error('加载世界列表失败:', err);
        setWorlds([]);
      } finally {
        setIsLoadingWorlds(false);
      }
    };
    
    loadWorlds();
  }, []);

  // Load roles when world changes
  useEffect(() => {
    if (selectedWorldId === '') {
      setCharacters([]);
      setSelectedCharacterName('');
      setSelectedVersionId('');
      setEmotions([]);
      setSelectedEmotion('');
      return;
    }
    
    const loadCharacters = async () => {
      setIsLoadingCharacters(true);
      setError(null);
      try {
        const characterList = await fetchRolesByWorld(Number(selectedWorldId), selectedWorld?.name || undefined);
        setCharacters(characterList);
        
        const roleNames = Array.from(new Set(characterList.map((item) => item.name).filter(Boolean)));
        if (roleNames.length > 0) {
          setSelectedCharacterName((prev) => roleNames.includes(prev) ? prev : roleNames[0]);
        } else {
          setSelectedCharacterName('');
          setSelectedVersionId('');
          setEmotions([]);
          setSelectedEmotion('');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载角色列表失败';
        setError(errorMessage);
        console.error('加载角色列表失败:', err);
        setCharacters([]);
        setSelectedCharacterName('');
        setSelectedVersionId('');
        setEmotions([]);
        setSelectedEmotion('');
      } finally {
        setIsLoadingCharacters(false);
      }
    };
    
    loadCharacters();
  }, [selectedWorldId, selectedWorld?.name]);

  // Choose version after role changes
  useEffect(() => {
    if (!selectedCharacterName) {
      setSelectedVersionId('');
      setEmotions([]);
      setSelectedEmotion('');
      return;
    }

    if (availableVersions.length === 0) {
      setSelectedVersionId('');
      setEmotions([]);
      setSelectedEmotion('');
      return;
    }

    setSelectedVersionId((prev) => {
      return availableVersions.includes(prev) ? prev : availableVersions[0];
    });
  }, [selectedCharacterName, availableVersions]);

  // Load emotions when role or version changes
  useEffect(() => {
    if (!selectedVersionId || !selectedCharacterName || !selectedRole) return;
    
    const loadEmotions = async () => {
      setIsLoadingEmotions(true);
      setError(null);
      try {
        const emotionList = await getRoleEmotions(selectedRole.id);
        setEmotions(emotionList);
        
        if (emotionList.length > 0) {
          setSelectedEmotion(emotionList[0].emotion);
        } else {
          setSelectedEmotion('');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载情感列表失败';
        setError(errorMessage);
        console.error('加载情感列表失败:', err);
        setEmotions([]);
      } finally {
        setIsLoadingEmotions(false);
      }
    };
    
    loadEmotions();
  }, [selectedVersionId, selectedCharacterName, selectedRole?.id]);

  // Sync edit state when emotion changes
  useEffect(() => {
    if (currentEmotionInfo) {
      setEditText(currentEmotionInfo.text);
      setEditTextLanguage(currentEmotionInfo.text_language || 'zh');
    } else {
      setEditText('');
      setEditTextLanguage('');
    }
    
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }
    
    setSelectedFile(null);
    setSelectedFileUrl(null);
    setSaveStatus('idle');
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedEmotion, currentEmotionInfo]);

  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId);
    setSelectedEmotion('');
    setEmotions([]);
  };

  const handleWorldChange = (worldId: number) => {
    setSelectedWorldId(worldId);
    setCharacters([]);
    setSelectedCharacterName('');
    setSelectedVersionId('');
    setSelectedEmotion('');
    setEmotions([]);
  };

  const handleCharacterChange = (characterName: string) => {
    setSelectedCharacterName(characterName);
    setSelectedVersionId('');
    setSelectedEmotion('');
    setEmotions([]);
  };

  const handleSave = async () => {
    if (!selectedRole || !selectedVersionId || !selectedCharacterName) {
      setError('请选择世界、角色和版本');
      return;
    }

    if (!editText.trim()) {
      setError('参考文本不能为空');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveStatus('idle');

    try {
      const updatedEmotions = await saveRoleEmotion({
        roleId: selectedRole.id,
        emotionName: selectedEmotion || currentEmotionInfo?.emotion || '默认',
        emotionText: editText.trim(),
        audioFile: selectedFile,
        textLanguage: editTextLanguage.trim() || selectedRole.language || 'zh',
      });
      setEmotions(updatedEmotions);
      setSelectedEmotion((prev) => updatedEmotions.some((emotion) => emotion.emotion === prev)
        ? prev
        : updatedEmotions[0]?.emotion || '');

      setSaveStatus('success');
      setSelectedFile(null);
      setSelectedFileUrl(null);
      
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败';
      setError(errorMessage);
      setSaveStatus('error');
      console.error('保存情感配置失败:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole || !selectedVersionId || !selectedCharacterName) {
      return;
    }

    if (!confirm('确定要清空当前参考配置吗？此操作不可恢复。')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const updatedEmotions = await deleteRoleEmotion(selectedRole.id, selectedEmotion);
      setEmotions(updatedEmotions);
      setSelectedEmotion(updatedEmotions[0]?.emotion || '');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除失败';
      setError(errorMessage);
      console.error('清空参考配置失败:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/m4a', 'audio/ogg', 'audio/aac'];
    const validExtensions = ['.wav', '.mp3', '.flac', '.m4a', '.ogg', '.aac'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('不支持的音频格式，请选择 WAV, MP3, FLAC, M4A, OGG 或 AAC 格式的文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }
    const url = URL.createObjectURL(file);
    setSelectedFileUrl(url);
  };

  const handleFileClear = () => {
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }
    setSelectedFile(null);
    setSelectedFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddNewEmotion = async ({
    emotionName,
    text,
    audioFile,
    audioSourcePath,
    textLanguage,
  }: {
    emotionName: string;
    text: string;
    audioFile?: File | null;
    audioSourcePath?: string | null;
    textLanguage?: string;
  }) => {
    if (!selectedRole || !selectedVersionId || !selectedCharacterName) return;

    try {
      const updatedEmotions = await saveRoleEmotion({
        roleId: selectedRole.id,
        emotionName,
        emotionText: text.trim(),
        audioFile,
        audioSourcePath,
        textLanguage: textLanguage?.trim() || selectedRole.language || 'zh',
      });
      setEmotions(updatedEmotions);
      setSelectedEmotion(emotionName);
      
      setIsAddModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败';
      setError(errorMessage);
      throw err; // 向上传递错误，让 Modal 处理
    }
  };

  // 清理选中的文件URL资源
  useEffect(() => {
    return () => {
      if (selectedFileUrl && selectedFileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(selectedFileUrl);
      }
    };
  }, [selectedFileUrl]);

  // 阻止整个页面的默认拖拽行为
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <MainLayout
      currentView={AppView.EMOTION}
      title="情感配置矩阵"
      subtitle="EMOTION_MATRIX_CONTROL"
      hideHeader
    >
      {/* MAIN CONTENT AREA */}
      <div className="h-full flex gap-6 min-h-0">
        {/* LEFT COLUMN: World / Role / Version / Emotion List */}
        <div className="w-80 shrink-0 flex flex-col min-h-0 gap-4">
          <div className="theme-section rounded-3xl p-5 flex flex-col gap-4">
            <CustomSelect
              label="所属世界"
              icon={<Globe className="theme-info-text w-4 h-4" />}
              value={selectedWorldId}
              options={worlds.map(w => ({ id: w.id, name: w.name }))}
              onChange={handleWorldChange}
              isLoading={isLoadingWorlds}
              placeholder="选择世界"
              variant="filled"
              searchable
            />

            <CustomSelect
              label="目标角色"
              icon={<User className="theme-accent-icon w-4 h-4" />}
              value={selectedCharacterName}
              options={availableRoles.map((role) => ({ id: role.name, name: role.name }))}
              onChange={handleCharacterChange}
              disabled={!selectedWorldId}
              isLoading={isLoadingCharacters}
              placeholder={!selectedWorldId ? "请先选择世界" : "选择角色"}
              variant="filled"
              searchable
            />

            <CustomSelect
              label="模型版本"
              icon={<Layers className="theme-accent-icon w-4 h-4" />}
              value={selectedVersionId}
              options={availableVersions.map((version) => ({ id: version, name: version }))}
              onChange={handleVersionChange}
              disabled={!selectedCharacterName}
              placeholder={!selectedCharacterName ? "请先选择角色" : "选择版本"}
              variant="filled"
              searchable
            />
          </div>

          {/* EmotionList when character is selected */}
          {selectedCharacterName && (
            <div className="flex-1 min-h-0">
              <EmotionList
                emotions={emotions}
                selectedEmotion={selectedEmotion}
                isLoadingEmotions={isLoadingEmotions}
                onEmotionSelect={setSelectedEmotion}
                onAddClick={() => setIsAddModalOpen(true)}
                selectedCharacterName={selectedCharacterName}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Editor */}
        <div className="flex-1 min-h-0 flex flex-col">
          {currentEmotionInfo ? (
            <EmotionEditor
              emotionInfo={currentEmotionInfo}
              version={selectedVersionId}
              worldName={worlds.find(w => w.id === selectedWorldId)?.name || ''}
              characterName={selectedCharacterName}
              editText={editText}
              editTextLanguage={editTextLanguage}
              selectedFile={selectedFile}
              selectedFileUrl={selectedFileUrl}
              saveStatus={saveStatus}
              error={error}
              isSaving={isSaving}
              isDeleting={isDeleting}
              onTextChange={setEditText}
              onTextLanguageChange={setEditTextLanguage}
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
              onSave={handleSave}
              onDelete={handleDelete}
              onErrorDismiss={() => setError(null)}
              fileInputRef={fileInputRef}
            />
          ) : (
            <div className="theme-empty-state flex-1 rounded-[32px] flex flex-col items-center justify-center border border-dashed backdrop-blur-md relative overflow-hidden group">
              <div className="theme-empty-orb-amber absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              <div className="theme-empty-orb-blue absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="theme-card w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700">
                  <Smile className="w-12 h-12 theme-kicker group-hover:theme-accent-text transition-colors duration-500" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="theme-title text-sm font-black uppercase tracking-[0.3em]">等待矩阵注入</h3>
                  <p className="theme-kicker text-[10px] font-bold uppercase tracking-widest">
                    {!selectedWorldId ? '请先选择世界' : !selectedCharacterName ? '请选择角色' : !selectedVersionId ? '请选择版本' : '请选择左侧列表中的情感进行配置'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
       {isAddModalOpen && (
         <AddEmotionModal
           isOpen={isAddModalOpen}
           onClose={() => setIsAddModalOpen(false)}
           onAdd={handleAddNewEmotion}
           version={selectedVersionId}
           characterName={selectedCharacterName}
           slicedDirectory={selectedWorkspace?.model_sliced_dir || ''}
           slicedAudioFiles={selectedWorkspace?.model_sliced_files || []}
           existingEmotions={emotions.map(e => e.emotion)}
           error={error}
           onErrorChange={setError}
         />
       )}
    </MainLayout>
  );
};

export default EmotionConfigView;
