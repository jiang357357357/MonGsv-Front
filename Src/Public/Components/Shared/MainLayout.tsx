import React from 'react';
import { AppView } from '../../../../types';

interface MainLayoutProps {
  currentView: AppView;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  hideHeader?: boolean;
  sidebar?: React.ReactNode;
  sidebarWidthClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  currentView: _currentView,
  title,
  subtitle,
  headerActions,
  hideHeader = false,
  sidebar,
  sidebarWidthClassName = 'lg:w-80',
  contentClassName = '',
  children,
}) => {
  return (
    <section className="h-full min-h-0 flex flex-col">
      {!hideHeader ? (
        <header className="theme-layout-header mb-3 shrink-0 rounded-xl border px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="theme-title text-3xl font-black tracking-tight">
                {title}
              </h2>
              <p className="theme-subtitle mt-2 text-sm">
                {subtitle || title}
              </p>
            </div>

            {headerActions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-3">{headerActions}</div>
            ) : null}
          </div>
        </header>
      ) : null}

      {sidebar ? (
        <div className="theme-page-split flex-1 min-h-0 flex flex-col lg:flex-row">
          <aside className={`theme-page-sidebar shrink-0 ${sidebarWidthClassName}`}>
            {sidebar}
          </aside>
          <div className={`theme-page-content min-w-0 flex-1 ${contentClassName}`}>{children}</div>
        </div>
      ) : (
        <div className={`flex-1 min-h-0 ${contentClassName}`}>{children}</div>
      )}
    </section>
  );
};

export default MainLayout;
