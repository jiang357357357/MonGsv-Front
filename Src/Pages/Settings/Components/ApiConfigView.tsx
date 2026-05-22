import React, { useState, useEffect } from 'react';
import { Server, Save, RefreshCcw, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { getApiConfig, saveApiConfig, type ApiConfig } from '../../../../System/Config';

// 从构建时注入的环境变量获取默认配置
const DEFAULT_PORT = parseInt(process.env.MON_GSV_PORT || '7020', 10);

const ApiConfigView: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>({ baseUrl: 'localhost', port: DEFAULT_PORT, basePath: '/Core' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fullUrl, setFullUrl] = useState('');

  // 获取API配置（从localStorage读取，如果没有则使用默认值）
  useEffect(() => {
    const savedConfig = getApiConfig();
    setConfig(savedConfig);
  }, []);

  // 更新完整URL
  useEffect(() => {
    const normalize = (p?: string) => {
      if (!p) return '';
      const noTrailing = String(p).replace(/\/+$/g, '');
      if (!noTrailing) return '';
      return noTrailing.startsWith('/') ? noTrailing : `/${noTrailing}`;
    };
    const path = normalize(config.basePath);
    setFullUrl(`http://${config.baseUrl}:${config.port}${path}`);
  }, [config]);

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, baseUrl: e.target.value }));
    setSaveStatus('idle');
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const port = parseInt(e.target.value) || 50007;
    setConfig(prev => ({ ...prev, port }));
    setSaveStatus('idle');
  };

  const handleBasePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, basePath: e.target.value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // 验证配置
      if (!config.baseUrl.trim()) {
        throw new Error('基础URL不能为空');
      }
      if (config.port < 1 || config.port > 65535) {
        throw new Error('端口号必须在1-65535之间');
      }
      const normalize = (p?: string) => {
        if (!p) return '';
        const noTrailing = String(p).replace(/\/+$/g, '');
        if (!noTrailing) return '';
        return noTrailing.startsWith('/') ? noTrailing : `/${noTrailing}`;
      };
      const normalizedBasePath = normalize(config.basePath);
      const toSave: ApiConfig = { ...config, basePath: normalizedBasePath };
      setConfig(toSave);
      saveApiConfig(toSave);
      
      // 可以在这里添加测试连接的逻辑
      // const testResult = await testConnection(fullUrl);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save API config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({ baseUrl: 'localhost', port: DEFAULT_PORT, basePath: '/Core' });
    setSaveStatus('idle');
  };

  const handleTestConnection = async () => {
    // 这里可以添加测试连接的逻辑
    alert(`测试连接: ${fullUrl}\n（此功能需要后端支持）`);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="theme-title text-2xl font-bold mb-1">后端API配置</h3>
          <p className="theme-kicker text-xs font-mono uppercase tracking-wide">
            /ROOT/API_CONFIG
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="theme-button-secondary p-3 rounded-xl transition-colors"
            title="重置为默认值"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
              isSaving
                ? 'theme-button-disabled'
                : saveStatus === 'success'
                ? 'theme-status-block-info'
                : 'theme-button-amber'
            }`}
          >
            {saveStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                已保存
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                保存失败
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存配置
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="theme-card flex-1 rounded-2xl p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl space-y-6">
          {/* Base URL Input */}
          <div className="space-y-2">
            <label className="theme-subtitle flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Server className="w-4 h-4" />
              基础URL / IP地址
            </label>
            <div className="relative">
              <input
                type="text"
                id="api-base-url"
                value={config.baseUrl}
                onChange={handleBaseUrlChange}
                placeholder="localhost 或 192.168.1.100"
                aria-label="基础URL或IP地址"
                className="theme-input w-full rounded-xl p-4 text-sm font-mono transition-all outline-none"
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <Globe className="theme-kicker w-4 h-4" />
              </div>
            </div>
            <p className="theme-kicker text-[10px] font-mono">
              支持域名、IP地址或 localhost
            </p>
          </div>

          {/* Port Input */}
          <div className="space-y-2">
            <label className="theme-subtitle flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Server className="w-4 h-4" />
              端口号
            </label>
            <div className="relative">
              <input
                type="number"
                id="api-port"
                value={config.port}
                onChange={handlePortChange}
                min="1"
                max="65535"
                aria-label="端口号"
                className="theme-input w-full rounded-xl p-4 text-sm font-mono transition-all outline-none"
              />
            </div>
            <p className="theme-kicker text-[10px] font-mono">
              端口范围: 1-65535
            </p>
          </div>

          {/* Base Path Input */}
          <div className="space-y-2">
            <label className="theme-subtitle flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Server className="w-4 h-4" />
              路径后缀
            </label>
            <div className="relative">
              <input
                type="text"
                id="api-base-path"
                value={config.basePath || ''}
                onChange={handleBasePathChange}
                placeholder="/Core，可留空"
                aria-label="路径后缀"
                className="theme-input w-full rounded-xl p-4 text-sm font-mono transition-all outline-none"
              />
            </div>
            <p className="theme-kicker text-[10px] font-mono">
              例如 /Core，留空则不带后缀
            </p>
          </div>

          {/* Full URL Display */}
          <div className="space-y-2">
            <label className="theme-subtitle flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              完整API地址
            </label>
            <div className="relative">
              <div 
                className="theme-button-primary w-full rounded-xl p-4 text-sm font-mono font-bold"
                role="textbox"
                aria-label="完整API地址"
              >
                {fullUrl}
              </div>
            </div>
            <p className="theme-kicker text-[10px] font-mono">
              此地址将用于所有API请求
            </p>
          </div>

          {/* Test Connection Button */}
          <div className="theme-divider pt-4 border-t">
            <button
              onClick={handleTestConnection}
              className="theme-button-secondary w-full py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              测试连接
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigView;
