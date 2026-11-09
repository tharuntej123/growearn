// Structured JSON & Leveled Logger for GrowEarn Platform
// Eliminates raw unstructured console calls, avoids emoji logs, and outputs standardized logs.

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: unknown;
}

function serializeMeta(meta: unknown): unknown {
  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    };
  }
  if (typeof meta === 'object' && meta !== null) {
    const serialized: Record<string, unknown> = {};
    for (const key of Object.keys(meta)) {
      const val = (meta as Record<string, unknown>)[key];
      serialized[key] = val instanceof Error ? serializeMeta(val) : val;
    }
    return serialized;
  }
  return meta;
}

function writeLog(level: LogLevel, message: string, meta?: unknown) {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta: meta !== undefined ? serializeMeta(meta) : undefined,
  };

  const line = JSON.stringify(payload) + '\n';
  if (typeof process !== 'undefined' && process.stderr && process.stdout) {
    if (level === 'error') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => writeLog('info', message, meta),
  warn: (message: string, meta?: unknown) => writeLog('warn', message, meta),
  error: (message: string, meta?: unknown) => writeLog('error', message, meta),
  debug: (message: string, meta?: unknown) => writeLog('debug', message, meta),
};

export default logger;
