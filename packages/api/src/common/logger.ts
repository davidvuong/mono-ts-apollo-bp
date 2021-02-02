/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
import winston from 'winston';
import { Writable } from 'stream';
import { constants } from 'http2';
import { getLoggerConfig } from './config';

export const logger = winston.createLogger({
  level: getLoggerConfig(process.env).logLevel,
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

export class MorganStreamWritable extends Writable {
  _write(chunk: Buffer | string | Uint8Array, encoding: string, callback: (error?: Error | null) => void): void {
    if (encoding === 'buffer') {
      const [status, logLine] = (chunk.toString('ascii') as string).trim().split('|');
      const statusCode = parseInt(status, 10);
      switch (true) {
        case statusCode < constants.HTTP_STATUS_BAD_REQUEST:
          logger.info(logLine);
          break;
        default:
          logger.error(logLine);
      }
    }
    callback();
  }
}
