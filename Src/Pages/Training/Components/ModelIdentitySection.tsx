import React from 'react';
import { Layers, Loader2, Cpu } from 'lucide-react';
import { TrainingParams } from '../types';
import { WorldInfo, RoleInfo } from '../Services/trainingApi';

interface ModelIdentitySectionProps {
  params: TrainingParams;
  roles: RoleInfo[];
  isTraining: boolean;
  isLoadingRoles: boolean;
  roleError: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRoleBlur: () => void;
  onRoleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const ModelIdentitySection: React.FC<ModelIdentitySectionProps> = ({
  params,
  roles,
  isTraining,
  isLoadingRoles,
  roleError,
  onChange,
  onRoleBlur,
  onRoleKeyDown,
}) => {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
      <div className="theme-section-soft flex items-center justify-between gap-4 rounded-xl p-5">
        <div className="theme-title flex items-center gap-3 whitespace-nowrap text-base font-black">
          <Layers className="h-5 w-5" /> 角色名称
        </div>
        <div className="relative w-full max-w-[320px]">
          <input
            id="role"
            name="characterName"
            value={params.characterName}
            onChange={onChange}
            onBlur={onRoleBlur}
            onKeyDown={onRoleKeyDown}
            disabled={isTraining || !params.worldName}
            aria-label="角色"
            list="role-options"
            placeholder={
              !params.worldName
                ? '请先选择世界'
                : '输入角色名'
            }
            className="theme-input w-full rounded-xl px-4 py-3 text-lg font-black text-right transition-all disabled:opacity-50"
          />
          <datalist id="role-options">
            {roles.map((role) => (
              <option key={role.id} value={role.name} />
            ))}
          </datalist>
          {isLoadingRoles && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="theme-kicker h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
      </div>

      <div className="theme-section-soft flex items-center justify-between gap-4 rounded-xl p-5">
        <div className="theme-title flex items-center gap-3 whitespace-nowrap text-base font-black">
          <Cpu className="h-5 w-5" /> GPU 编号
        </div>
        <input
          id="gpuNumbers"
          name="gpuNumbers"
          value={params.gpuNumbers}
          onChange={onChange}
          type="text"
          placeholder="0,1,2"
          disabled={isTraining}
          className="theme-input w-28 rounded-xl px-4 py-3 text-center text-lg font-black transition-all disabled:opacity-50"
        />
      </div>
      {roleError && <p className="theme-status-danger px-1 text-sm font-medium xl:col-span-2">{roleError}</p>}
    </div>
  );
};

export default ModelIdentitySection;

