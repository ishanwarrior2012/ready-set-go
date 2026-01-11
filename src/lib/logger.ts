/**
 * Centralized logger utility that only outputs logs in development mode.
 * This prevents internal information leakage in production environments.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LoggerOptions {
  /** Whether to include timestamps in logs */
  includeTimestamp?: boolean;
}

const defaultOptions: LoggerOptions = {
  includeTimestamp: true,
};

function formatMessage(level: LogLevel, message: string, options: LoggerOptions): string {
  const timestamp = options.includeTimestamp ? `[${new Date().toISOString()}]` : '';
  const levelTag = `[${level.toUpperCase()}]`;
  return `${timestamp} ${levelTag} ${message}`.trim();
}

/**
 * Logger object with methods for different log levels.
 * All methods check for development mode before outputting.
 */
export const logger = {
  /**
   * Log an error message. Only outputs in development mode.
   */
  error: (message: string, error?: unknown, options: LoggerOptions = defaultOptions) => {
    if (import.meta.env.DEV) {
      console.error(formatMessage('error', message, options), error);
    }
    // In production, you could optionally send to an error tracking service like Sentry
  },

  /**
   * Log a warning message. Only outputs in development mode.
   */
  warn: (message: string, data?: unknown, options: LoggerOptions = defaultOptions) => {
    if (import.meta.env.DEV) {
      console.warn(formatMessage('warn', message, options), data ?? '');
    }
  },

  /**
   * Log an info message. Only outputs in development mode.
   */
  info: (message: string, data?: unknown, options: LoggerOptions = defaultOptions) => {
    if (import.meta.env.DEV) {
      console.log(formatMessage('info', message, options), data ?? '');
    }
  },

  /**
   * Log a debug message. Only outputs in development mode.
   */
  debug: (message: string, data?: unknown, options: LoggerOptions = defaultOptions) => {
    if (import.meta.env.DEV) {
      console.debug(formatMessage('debug', message, options), data ?? '');
    }
  },
};
