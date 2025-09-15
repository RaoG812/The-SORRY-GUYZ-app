export function createLogger() {
  return {
    info: (...args: unknown[]) => console.log('[info]', ...args),
    error: (...args: unknown[]) => console.error('[error]', ...args),
    debug: (...args: unknown[]) => console.debug('[debug]', ...args)
  };
}
