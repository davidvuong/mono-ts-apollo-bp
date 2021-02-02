import { Request, Response } from 'express';
import { constants } from 'http2';
import { isNil } from 'lodash';
import { DecodeJsonError } from '@monots/shared';
import { logger } from './logger';

const isError = (err: string | Error): err is Error => err instanceof Error;

export class ApiError extends Error {
  message: string;

  constructor(messageOrErr: string | Error) {
    const message = isError(messageOrErr) ? messageOrErr.message : messageOrErr;
    super(message);
    this.message = message;
  }
}

export class RepositoryError extends ApiError {}
export class NotFoundError extends ApiError {}
export class ValidationError extends ApiError {}
export class MetricsError extends ApiError {}
export class ServiceError extends ApiError {}
export class HttpError extends ApiError {}
export class BadRequestError extends HttpError {}
export class AuthenticationError extends HttpError {}
export class AuthorizationError extends HttpError {}

export interface ErrorResponse {
  error: string;
}

export const httpStatusCodeFromError = (err: ApiError): number => {
  switch (true) {
    case err instanceof DecodeJsonError:
    case err instanceof ValidationError:
    case err instanceof BadRequestError:
      return constants.HTTP_STATUS_BAD_REQUEST;
    case err instanceof NotFoundError:
      return constants.HTTP_STATUS_NOT_FOUND;
    case err instanceof RepositoryError:
      return constants.HTTP_STATUS_INTERNAL_SERVER_ERROR;
    case err instanceof AuthenticationError:
      return constants.HTTP_STATUS_FORBIDDEN;
    case err instanceof AuthorizationError:
      return constants.HTTP_STATUS_UNAUTHORIZED;
    default:
      return constants.HTTP_STATUS_INTERNAL_SERVER_ERROR;
  }
};

export const handleHttpError = (err: ApiError, req: Request, res: Response): ErrorResponse => {
  const status = httpStatusCodeFromError(err);

  const payload: ErrorResponse = { error: err.message };
  if (status === constants.HTTP_STATUS_INTERNAL_SERVER_ERROR) {
    payload.error = 'Internal Server Error';

    logger.error(`InternalServerError - message=${err.message} - name=${err.constructor.name} - status=${status}`);
    if (!isNil(err.stack)) {
      logger.error(err.stack);
    }
  }
  res.status(status).json(payload);
  return payload;
};
