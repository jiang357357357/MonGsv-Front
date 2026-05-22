import React from 'react';
import { CheckCircle2, ServerCrash, ShieldAlert } from 'lucide-react';
import { RouteTestResult } from '../types';

interface TestResultPanelProps {
  result: RouteTestResult | null;
  errorText: string | null;
  prettyJson: (value: unknown) => string;
}

const TestResultPanel: React.FC<TestResultPanelProps> = ({
  result,
  errorText,
  prettyJson,
}) => {
  const audioBase64 = (() => {
    if (!result || typeof result.data !== 'object' || result.data === null) {
      return null;
    }
    const value = (result.data as { audio_data?: unknown }).audio_data;
    return typeof value === 'string' && value.length > 0 ? value : null;
  })();

  return (
    <div className="theme-card flex h-full min-h-0 flex-col rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="theme-title text-lg font-black">执行结果</h3>
          <p className="theme-subtitle mt-2 text-sm">
            直接看功能执行结果，不再先看路由清单。
          </p>
        </div>
        {result ? (
          <div className="flex items-center gap-2 text-sm font-black">
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--color-success-500)]" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[var(--color-warning-500)]" />
            )}
            <span>{result.status}</span>
            <span className="text-[var(--color-text-tertiary)]">· {result.durationMs}ms</span>
          </div>
        ) : errorText ? (
          <div className="flex items-center gap-2 text-sm font-black text-[var(--color-danger-500)]">
            <ServerCrash className="h-4 w-4" />
            <span>执行失败</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
        {result ? (
          <>
            <div className="rounded-2xl bg-[var(--color-gray-50)] px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
              <div>{result.method} {result.url}</div>
              <div className="mt-1">HTTP {result.status} · {result.durationMs}ms · {result.contentType.toUpperCase()}</div>
            </div>
            {audioBase64 ? (
              <div className="theme-card-soft rounded-2xl border px-4 py-4">
                <div className="mb-3 text-sm font-black">音频预览</div>
                <audio controls className="w-full" src={`data:audio/wav;base64,${audioBase64}`} />
              </div>
            ) : null}
            <pre className="theme-card min-h-0 flex-1 overflow-auto rounded-2xl border px-4 py-4 text-xs leading-6 text-[var(--color-text-primary)]">
              {prettyJson(result.data)}
            </pre>
          </>
        ) : (
          <div className="theme-card-soft flex min-h-[12rem] flex-1 items-center justify-center rounded-2xl border px-6 text-sm text-[var(--color-text-secondary)]">
            先在左侧选择一个功能模块，再执行一次测试。
          </div>
        )}

        {errorText ? (
          <div className="rounded-2xl border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-4 py-3 text-sm text-[var(--color-danger-500)]">
            {errorText}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TestResultPanel;
