export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

type LogMethod = (message: string, meta?: unknown) => void;

export interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

function getTimestampPrefix(): string {
  const now = new Date();
  const pad = (value: number, width = 2) => String(value).padStart(width, '0');
  return [
    now.getFullYear(),
    '-',
    pad(now.getMonth() + 1),
    '-',
    pad(now.getDate()),
    ' ',
    pad(now.getHours()),
    ':',
    pad(now.getMinutes()),
    ':',
    pad(now.getSeconds()),
    '.',
    pad(now.getMilliseconds(), 3),
  ].join('');
}

function getCallerLine(): string {
  const stack = new Error().stack;
  if (!stack) {
    return 'line:?';
  }

  const lines = stack.split('\n').map(line => line.trim());
  const callerLine = lines.find(
    line => line.includes('.ts:') || line.includes('.tsx:'),
  );

  if (!callerLine) {
    return 'line:?';
  }

  const match = callerLine.match(/[:(](\d+):\d+\)?$/);
  if (!match) {
    return 'line:?';
  }

  return `line:${match[1]}`;
}

function stringifyMeta(meta?: unknown): string {
  if (meta === undefined) {
    return '';
  }

  if (typeof meta === 'string') {
    return ` ${meta}`;
  }

  try {
    return ` ${JSON.stringify(meta, null, 0)}`;
  } catch {
    return ` ${String(meta)}`;
  }
}

function emitLog(mainModule: string, subModule: string, level: LogLevel, message: string, meta?: unknown) {
  const prefix = [
    `[${getTimestampPrefix()}]`,
    `[${mainModule}]`,
    `[${subModule}]`,
    `[${level}]`,
    `[${getCallerLine()}]`,
  ].join('');
  const text = `${prefix}${message}${stringifyMeta(meta)}`;

  switch (level) {
    case 'DEBUG':
      console.debug(text);
      break;
    case 'INFO':
      console.info(text);
      break;
    case 'WARN':
      console.warn(text);
      break;
    case 'ERROR':
      console.error(text);
      break;
  }
}

export function createLogger(mainModule: string, subModule: string): Logger {
  return {
    debug: (message, meta) => emitLog(mainModule, subModule, 'DEBUG', message, meta),
    info: (message, meta) => emitLog(mainModule, subModule, 'INFO', message, meta),
    warn: (message, meta) => emitLog(mainModule, subModule, 'WARN', message, meta),
    error: (message, meta) => emitLog(mainModule, subModule, 'ERROR', message, meta),
  };
}
