import React, { useState } from 'react';
import { Folder, FileAudio, Settings, ChevronRight, Upload, Trash2, RefreshCcw, HardDrive, SquareTerminal, Server } from 'lucide-react';
import TerminalView from './Components/TerminalView';
import ApiConfigView from './Components/ApiConfigView';
import { MOCK_MODELS, MOCK_AUDIOS } from './constants';
import { SettingsCategory } from './types';
import MainLayout from '../../Public/Components/Shared/MainLayout';
import { AppView } from '../../types';

const SettingsPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>('models');

  const categoryConfig = [
    { id: 'models' as SettingsCategory, label: '模型仓库', icon: HardDrive },
    { id: 'dataset' as SettingsCategory, label: '数据集', icon: Folder },
    { id: 'audio' as SettingsCategory, label: '参考音频', icon: FileAudio },
    { id: 'api' as SettingsCategory, label: 'API配置', icon: Server },
    { id: 'terminal' as SettingsCategory, label: '系统终端', icon: SquareTerminal },
  ];

  return (
    <MainLayout
      currentView={AppView.SETTINGS}
      title="资源与配置"
      subtitle="SYSTEM_SETTINGS_MANAGER"
    >
      <div className="h-full grid grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT: Tree Navigation (3 Cols) */}
        <div className="col-span-3 glass-panel rounded-3xl p-6 flex flex-col gap-2">
           <div className="theme-divider pb-4 mb-2 border-b flex items-center justify-between">
              <h2 className="theme-title font-bold">资源管理器</h2>
              <Settings className="theme-kicker w-4 h-4" />
           </div>

           {categoryConfig.map((item) => (
               <button
                 key={item.id}
                 onClick={() => setSelectedCategory(item.id)}
                 className={`flex items-center justify-between p-4 rounded-xl text-sm font-bold transition-all ${
                   selectedCategory === item.id 
                   ? 'theme-nav-item theme-nav-item-active shadow-lg' 
                   : 'theme-button-ghost text-left'
                 }`}
               >
                  <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                  </div>
                  {selectedCategory === item.id && <ChevronRight className="theme-accent-text w-4 h-4" />}
               </button>
           ))}
        </div>

        {/* RIGHT: Content Area (9 Cols) */}
        <div className="col-span-9 glass-panel rounded-3xl p-8 flex flex-col relative overflow-hidden">
           {selectedCategory === 'terminal' ? (
               <div className="absolute inset-0 p-4 theme-app-shell">
                  <TerminalView />
               </div>
           ) : selectedCategory === 'api' ? (
               <ApiConfigView />
           ) : (
              <>
                  <div className="flex justify-between items-center mb-8">
                      <div>
                          <h3 className="theme-title text-2xl font-bold mb-1">
                              {selectedCategory === 'models' && '模型仓库管理'}
                              {selectedCategory === 'dataset' && '数据集配置'}
                              {selectedCategory === 'audio' && '参考音频库'}
                          </h3>
                          <p className="theme-kicker text-xs font-mono uppercase tracking-wide">
                          /ROOT/{selectedCategory.toUpperCase()}
                          </p>
                      </div>
                      <div className="flex gap-3">
                          <button className="theme-button-secondary p-3 rounded-xl transition-colors">
                              <RefreshCcw className="w-4 h-4" />
                          </button>
                          <button className="theme-button-amber px-4 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              上传资源
                          </button>
                      </div>
                  </div>

                  {/* Tables */}
                  <div className="theme-card flex-1 rounded-2xl overflow-hidden">
                      {selectedCategory === 'models' && (
                          <table className="w-full text-left">
                              <thead className="theme-table-head text-xs uppercase font-bold">
                                  <tr>
                                      <th className="p-4">Filename</th>
                                      <th className="p-4">Size</th>
                                      <th className="p-4">Date</th>
                                      <th className="p-4 text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="text-sm">
                                  {MOCK_MODELS.map(m => (
                                      <tr key={m.id} className="theme-table-row transition-colors">
                                          <td className="theme-table-cell-primary p-4 font-bold flex items-center gap-2">
                                              <HardDrive className="theme-accent-text w-4 h-4" />
                                              {m.name}
                                          </td>
                                          <td className="theme-table-cell-secondary p-4 font-mono">{m.size}</td>
                                          <td className="theme-table-cell-secondary p-4 font-mono">{m.date}</td>
                                          <td className="p-4 text-right">
                                              <button className="theme-button-danger-ghost p-1 rounded transition-colors">
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}

                      {selectedCategory === 'audio' && (
                          <table className="w-full text-left">
                              <thead className="theme-table-head text-xs uppercase font-bold">
                                  <tr>
                                      <th className="p-4">Audio File</th>
                                      <th className="p-4">Duration</th>
                                      <th className="p-4">Emotion Tag</th>
                                      <th className="p-4 text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="text-sm">
                                  {MOCK_AUDIOS.map(a => (
                                      <tr key={a.id} className="theme-table-row transition-colors">
                                          <td className="theme-table-cell-primary p-4 font-bold flex items-center gap-2">
                                              <FileAudio className="theme-accent-text w-4 h-4" />
                                              {a.name}
                                          </td>
                                          <td className="theme-table-cell-secondary p-4 font-mono">{a.duration}</td>
                                          <td className="p-4">
                                              <span className="theme-tag px-2 py-1 rounded-md text-xs font-bold">
                                                  {a.emotion}
                                              </span>
                                          </td>
                                          <td className="p-4 text-right">
                                              <button className="theme-button-danger-ghost p-1 rounded transition-colors">
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}
                  </div>
              </>
           )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPanel;
