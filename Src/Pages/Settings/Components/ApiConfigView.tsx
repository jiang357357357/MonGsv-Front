import React, { useState } from 'react';
import { Server, Save, RefreshCcw, CheckCircle2, AlertCircle, Globe, LoaderCircle } from 'lucide-react';
import { buildApiBaseUrl, getApiConfig, getDefaultApiConfig, normalizeApiConfig, saveApiConfig, type ApiConfig } from '../../../../System/Config';
import { testApiConnection, type ApiConnectionResult } from '../Services/apiConnection';

const ApiConfigView: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>(getApiConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ApiConnectionResult | null>(null);
  let fullUrl = '';
  try {
    fullUrl = buildApiBaseUrl(config);
  } catch {
    // Keep the form editable while an address or port is incomplete.
  }

  const updateConfig = (changes: Partial<ApiConfig>) => {
    setConfig(previous => ({ ...previous, ...changes }));
    setSaveStatus('idle');
    setSaveError('');
    setConnectionResult(null);
  };

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ baseUrl: e.target.value });
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ port: Number(e.target.value) });
  };

  const handleBasePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ basePath: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveError('');

    try {
      const toSave = normalizeApiConfig(config);
      setConfig(toSave);
      saveApiConfig(toSave);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : '保存失败');
      console.error('Failed to save API config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(getDefaultApiConfig());
    setSaveStatus('idle');
    setSaveError('');
    setConnectionResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionResult(null);
    try {
      setConnectionResult(await testApiConnection(config));
    } catch (error) {
      setConnectionResult({ type: 'error', message: error instanceof Error ? error.message : '连接失败', url: '' });
    } finally {
      setIsTesting(false);
    }
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
            disabled={isTesting}
            className="theme-button-secondary p-3 rounded-xl transition-colors"
            title="重置为默认值"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isTesting}
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
                disabled={isTesting}
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
                disabled={isTesting}
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
                disabled={isTesting}
                onChange={handleBasePathChange}
                placeholder="直接连接网关时留空"
                aria-label="路径后缀"
                className="theme-input w-full rounded-xl p-4 text-sm font-mono transition-all outline-none"
              />
            </div>
            <p className="theme-kicker text-[10px] font-mono">
              直接连接本项目网关时请留空；通过带路径前缀的代理访问时再填写
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
                {fullUrl || '请填写有效的 API 地址和端口'}
              </div>
            </div>
            <p className="theme-kicker text-[10px] font-mono">
              此地址将用于所有API请求
            </p>
          </div>

          {/* Test Connection Button */}
          {saveError && <p role="alert" className="theme-status-block-danger rounded-xl p-3 text-sm">{saveError}</p>}
          <div className="theme-divider pt-4 border-t space-y-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="theme-button-secondary w-full py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-bold"
            >
              {isTesting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isTesting ? '正在测试…' : '测试连接'}
            </button>
            <p className="theme-kicker text-xs">测试使用当前填写的地址；修改后需保存配置。</p>
            {connectionResult && (
              <div role="status" aria-live="polite" className={`rounded-xl p-4 text-sm ${
                connectionResult.type === 'success' ? 'theme-status-block-success'
                  : connectionResult.type === 'warning' ? 'theme-status-block-warning' : 'theme-status-block-danger'
              }`}>
                <p>{connectionResult.message}</p>
                {connectionResult.url && <p className="mt-2 break-all font-mono text-xs">{connectionResult.url}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigView;
