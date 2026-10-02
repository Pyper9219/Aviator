export function log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
  };
  console.log(JSON.stringify(entry));
}

export const logger = {
  info: (msg: string, meta?: any) => log('info', msg, meta),
  warn: (msg: string, meta?: any) => log('warn', msg, meta),
  error: (msg: string, meta?: any) => log('error', msg, meta),
};