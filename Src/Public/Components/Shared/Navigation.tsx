import React from 'react';
import {
  Activity,
  AppWindow,
  AudioLines,
  BrainCircuit,
  FolderCog,
  Settings2,
} from 'lucide-react';
import { AppView } from '../../../../types';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    view: AppView.SYNTHESIS,
    label: '语音合成',
    icon: AudioLines,
  },
  {
    view: AppView.TRAINING,
    label: '模型训练',
    icon: BrainCircuit,
  },
  {
    view: AppView.EMOTION,
    label: '情感配置',
    icon: AppWindow,
  },
  {
    view: AppView.BACKEND_TEST,
    label: '后端测试',
    icon: Activity,
  },
  {
    view: AppView.MANAGEMENT,
    label: '资源管理',
    icon: FolderCog,
  },
  {
    view: AppView.SETTINGS,
    label: '系统设置',
    icon: Settings2,
  },
];

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  return (
    <aside className="theme-sidebar h-full w-72 flex flex-col">
      <div className="theme-divider px-6 pt-8 pb-6 border-b">
        <h1 className="theme-title text-2xl font-black tracking-tight">
          控制台
        </h1>
        <p className="theme-subtitle mt-2 text-sm leading-relaxed">
          统一处理合成、训练、情感与资源管理。
        </p>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.view;

          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onViewChange(item.view)}
              className={[
                'w-full rounded-xl border px-4 py-4 text-left transition-all duration-200',
                active ? 'theme-nav-item theme-nav-item-active' : 'theme-nav-item',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div className="theme-nav-indicator h-10 w-1 shrink-0 rounded-full" />
                <div
                  className={[
                    'theme-nav-icon flex h-10 w-10 items-center justify-center rounded-xl',
                  ].join(' ')}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="theme-nav-copy min-w-0">
                  <div className="text-sm font-black tracking-wide">{item.label}</div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Navigation;
