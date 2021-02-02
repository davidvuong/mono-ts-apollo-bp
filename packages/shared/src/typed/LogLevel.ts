import { Joi } from '../common/joi';

// eslint-disable-next-line no-shadow
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export const LogLevelSchema = Joi.string().valid(...Object.values(LogLevel));
