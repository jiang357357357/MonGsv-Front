import React from 'react';
import { HttpMethod, RequestContentType } from '../../types';

interface CustomRequestTestPageProps {
  method: HttpMethod;
  contentType: RequestContentType;
  path: string;
  body: string;
  runningId: string | null;
  onMethodChange: (value: HttpMethod) => void;
  onContentTypeChange: (value: RequestContentType) => void;
  onPathChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onStart: () => void;
}

const CustomRequestTestPage: React.FC<CustomRequestTestPageProps> = ({
  method,
  contentType,
  path,
  body,
  runningId,
  onMethodChange,
  onContentTypeChange,
  onPathChange,
  onBodyChange,
  onStart,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="theme-title text-2xl font-black">自定义调试</h3>
        <p className="theme-subtitle mt-2 text-sm">
          保留手工接口调试，但它现在是辅助工具，不是主界面。
        </p>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <label className="col-span-2 block">
          <span className="mb-2 block text-xs font-black text-[var(--color-text-secondary)]">方法</span>
          <select
            value={method}
            onChange={(event) => onMethodChange(event.target.value as HttpMethod)}
            className="theme-input w-full rounded-xl px-3 py-3 text-sm"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </label>
        <label className="col-span-3 block">
          <span className="mb-2 block text-xs font-black text-[var(--color-text-secondary)]">负载类型</span>
          <select
            value={contentType}
            onChange={(event) => onContentTypeChange(event.target.value as RequestContentType)}
            className="theme-input w-full rounded-xl px-3 py-3 text-sm"
          >
            <option value="json">JSON</option>
            <option value="form">FormData</option>
          </select>
        </label>
        <label className="col-span-7 block">
          <span className="mb-2 block text-xs font-black text-[var(--color-text-secondary)]">路径</span>
          <input
            value={path}
            onChange={(event) => onPathChange(event.target.value)}
            className="theme-input w-full rounded-xl px-3 py-3 text-sm"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-2 block text-xs font-black text-[var(--color-text-secondary)]">请求体</span>
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          className="theme-input h-56 w-full rounded-2xl px-4 py-4 font-mono text-sm"
          spellCheck={false}
        />
      </label>
      <button
        type="button"
        onClick={onStart}
        className="theme-nav-item theme-nav-item-active rounded-xl border px-5 py-3 text-sm font-black"
      >
        {runningId === 'custom' ? '执行中' : '执行自定义请求'}
      </button>
    </div>
  );
};

export default CustomRequestTestPage;
