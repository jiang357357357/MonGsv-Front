import React from 'react';
import { RefreshCw } from 'lucide-react';

interface TestModuleItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TestSidebarProps {
  modules: TestModuleItem[];
  activeModule: string;
  isRefreshingWorkspaces?: boolean;
  onModuleChange: (moduleId: string) => void;
  onRefreshWorkspaces?: () => void;
}

const TestSidebar: React.FC<TestSidebarProps> = ({
  modules,
  activeModule,
  isRefreshingWorkspaces = false,
  onModuleChange,
  onRefreshWorkspaces,
}) => {
  return (
    <div className="flex h-full flex-col">
      <div className="theme-divider border-b px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="theme-title text-lg font-black">功能测试</h3>
            <p className="theme-subtitle mt-2 text-sm">
              先测实际能力，再看结果。
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshWorkspaces}
            disabled={isRefreshingWorkspaces}
            title="刷新角色目录"
            className="theme-nav-item flex h-10 w-10 items-center justify-center rounded-xl border disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={['h-4 w-4', isRefreshingWorkspaces ? 'animate-spin' : ''].join(' ')} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {modules.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeModule;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onModuleChange(item.id)}
              className={[
                'w-full rounded-xl border px-4 py-4 text-left transition-colors',
                active ? 'theme-nav-item theme-nav-item-active' : 'theme-nav-item',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div className="theme-nav-icon flex h-10 w-10 items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black">{item.title}</div>
                  <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TestSidebar;
