import React from 'react';
import { Play, Pause, Layers, Globe, SlidersHorizontal } from 'lucide-react';
import CustomSelect from '../../../Emotion/Components/CustomSelect';
import ModelIdentitySection from '../../Components/ModelIdentitySection';
import TrainingParamsSection from '../../Components/TrainingParamsSection';
import { TrainingParams } from '../../types';
import { WorldInfo, RoleInfo } from '../../Services/trainingApi';

interface TrainingConfigPageProps {
  params: TrainingParams;
  versions: string[];
  worlds: WorldInfo[];
  roles: RoleInfo[];
  isLoadingVersions: boolean;
  isLoadingWorlds: boolean;
  isLoadingRoles: boolean;
  versionError: string | null;
  worldError: string | null;
  roleError: string | null;
  isTraining: boolean;
  canStartTraining: boolean;
  canStartSingleTraining: boolean;
  startDisabledReason: string;
  onVersionChange: (value: string) => void;
  onWorldChange: (value: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRoleBlur: () => void;
  onRoleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onToggleTraining: () => void;
  onStartGptOnly: () => void;
  onStartSovitsOnly: () => void;
}

const TrainingConfigPage: React.FC<TrainingConfigPageProps> = ({
  params,
  versions,
  worlds,
  roles,
  isLoadingVersions,
  isLoadingWorlds,
  isLoadingRoles,
  versionError,
  worldError,
  roleError,
  isTraining,
  canStartTraining,
  canStartSingleTraining,
  startDisabledReason,
  onVersionChange,
  onWorldChange,
  onChange,
  onRoleBlur,
  onRoleKeyDown,
  onToggleTraining,
  onStartGptOnly,
  onStartSovitsOnly,
}) => {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0">
        <h3 className="theme-title text-xl font-black tracking-tight">训练配置</h3>
        <p className="theme-subtitle mt-1 text-sm">选择版本与世界，设置角色、GPU 与训练参数。</p>
      </div>

      <div className="theme-divider my-4 border-t" />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <CustomSelect
              label="所属世界"
              icon={<Globe className="theme-info-text w-4 h-4" />}
              value={params.worldName}
              options={worlds.map((w) => ({ id: w.name, name: w.name }))}
              onChange={onWorldChange}
              isLoading={isLoadingWorlds}
              placeholder="选择或输入世界"
              align="left"
              variant="filled"
            />
            <CustomSelect
              label="模型版本"
              icon={<Layers className="theme-accent-text w-4 h-4" />}
              value={params.version}
              options={versions.map((v) => ({ id: v, name: v }))}
              onChange={onVersionChange}
              disabled={!params.worldName}
              isLoading={isLoadingVersions}
              placeholder={!params.worldName ? '请先选择世界' : '选择或输入版本'}
              align="left"
              variant="filled"
            />
          </div>

          {versionError && <div className="theme-status-block-danger rounded-lg px-3 py-2 text-xs font-medium">版本列表加载失败：{versionError}</div>}
          {worldError && <div className="theme-status-block-danger rounded-lg px-3 py-2 text-xs font-medium">世界列表加载失败：{worldError}</div>}

          <div className="theme-section-soft rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="theme-kicker w-4 h-4" />
              <span className="theme-title text-sm font-black tracking-tight">基础参数</span>
            </div>
            <div className="flex flex-col gap-3">
              <ModelIdentitySection
                params={params}
                roles={roles}
                isTraining={isTraining}
                isLoadingRoles={isLoadingRoles}
                roleError={roleError}
                onChange={onChange}
                onRoleBlur={onRoleBlur}
                onRoleKeyDown={onRoleKeyDown}
              />
              <TrainingParamsSection params={params} isTraining={isTraining} onChange={onChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="theme-divider mt-4 border-t pt-4 shrink-0">
        <div className="flex flex-col gap-3">
          <button
            onClick={onToggleTraining}
            disabled={!isTraining && !canStartTraining}
            className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm tracking-wide ${
              isTraining ? 'theme-status-block-warning' : !canStartTraining ? 'theme-button-disabled' : 'theme-button-amber'
            }`}
            title={!isTraining && !canStartTraining ? startDisabledReason : ''}
          >
            {isTraining ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isTraining ? '停止训练任务' : !canStartTraining ? startDisabledReason : '开始完整训练引导'}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={onStartSovitsOnly}
              disabled={isTraining || !canStartSingleTraining}
              className={`${isTraining || !canStartSingleTraining ? 'theme-button-disabled' : 'theme-section-soft hover:theme-card'} rounded-lg border px-4 py-3 text-sm font-bold transition-all`}
              title="只启动 SoVITS 训练，要求项目目录中已存在完整预处理结果"
            >
              仅启动 SoVITS 训练
            </button>
            <button
              onClick={onStartGptOnly}
              disabled={isTraining || !canStartSingleTraining}
              className={`${isTraining || !canStartSingleTraining ? 'theme-button-disabled' : 'theme-section-soft hover:theme-card'} rounded-lg border px-4 py-3 text-sm font-bold transition-all`}
              title="只启动 GPT 训练，要求项目目录中已存在完整预处理结果"
            >
              仅启动 GPT 训练
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingConfigPage;
