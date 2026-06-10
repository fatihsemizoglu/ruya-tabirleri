/**
 * Merkezi logging utility.
 * Production build'de esbuild tarafından console.* çağrıları kaldırılır (vite.config.ts esbuild.drop).
 * Development ortamında normal console'a yazar.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  error: isDev ? console.error.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  info: isDev ? console.info.bind(console) : () => {},
  log: isDev ? console.log.bind(console) : () => {},
};
