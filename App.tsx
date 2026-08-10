import React, { useState } from 'react';
import Navigation from './Src/Public/Components/Shared/Navigation';
import SynthesisView from './Src/Pages/Synthesis';
import TrainingDashboard from './Src/Pages/Training';
import SettingsPanel from './Src/Pages/Settings';
import EmotionConfigView from './Src/Pages/Emotion';
import ManagementDashboard from './Src/Pages/Management';
import BackendTestPage from './Src/Pages/BackendTest';
import ProfileSettings from './Src/Pages/Profile';
import { AppView } from './types';
import { createLogger } from './System/Log/logger';

// 应用启动日志
const appLogger = createLogger('App', 'Main');
console.log('=== 应用启动 ===');
appLogger.info('应用已启动');
appLogger.debug('当前环境', { mode: (import.meta as any).env?.MODE || 'unknown' });

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SYNTHESIS);
  const isTrainingView = currentView === AppView.TRAINING;
  const isBackendTestView = currentView === AppView.BACKEND_TEST;

  const renderView = () => {
    switch (currentView) {
      case AppView.SYNTHESIS:
        return <SynthesisView />;
      case AppView.TRAINING:
        return <TrainingDashboard />;
      case AppView.EMOTION:
        return <EmotionConfigView />;
      case AppView.BACKEND_TEST:
        return <BackendTestPage />;
      case AppView.PROFILE:
        return <ProfileSettings />;
      case AppView.SETTINGS:
        return <SettingsPanel />;
      case AppView.MANAGEMENT:
        return <ManagementDashboard />;
      default:
        return <SynthesisView />;
    }
  };

  return (
    <div className="theme-app-shell h-screen w-screen relative overflow-hidden font-sans">

      {/* Unified Main Console Container - Full Screen */}
      <div className="theme-app-frame w-full h-full flex shadow-2xl relative z-10 overflow-hidden">

        {/* Navigation Sidebar (Integrated) */}
        <div className="theme-sidebar flex-shrink-0 z-20 backdrop-blur-xl border-r">
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {/* Main Content Area */}
        <main className="theme-stage flex-1 h-full min-h-0 relative z-10 flex flex-col overflow-x-hidden overflow-y-auto">
          <div
            className={`flex-1 min-h-full w-full flex flex-col ${
              isTrainingView || isBackendTestView ? 'p-4 lg:p-5 xl:p-6' : 'p-6 lg:p-8'
            }`}
          >
             <div key={currentView} className="min-h-full flex flex-col view-enter">
                {renderView()}
             </div>
          </div>
        </main>

      </div>

    </div>
  );
};

export default App;
