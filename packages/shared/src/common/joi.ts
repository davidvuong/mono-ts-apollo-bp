import Joi from 'joi';

const VALIDATION_OPTIONS = { allowUnknown: true };

const isJoiError = (err: Error | Joi.ValidationError): err is Joi.ValidationError => (err as Joi.ValidationError).isJoi;

export class DecodeJsonError extends Error {
  static fromJoiError(err: Error | Joi.ValidationError): DecodeJsonError {
    let errMessage: string;

    if (isJoiError(err)) {
      const firstError = err.details.map(d => d.message)[0].replace(/"/g, "'");
      errMessage = `Encountered JSON decoder error: ${firstError}`;
    } else {
      errMessage = err.toString();
    }
    return new DecodeJsonError(errMessage);
  }
}

const validateSchema = <A>(message: A | Record<string, unknown>, schema: Joi.Schema): Promise<A> => {
  const { error, value } = schema.validate(message, VALIDATION_OPTIONS);
  if (error) {
    return Promise.reject(DecodeJsonError.fromJoiError(error));
  }
  return Promise.resolve(value);
};

const validateSchemaWithThrow = <A>(message: Record<string, unknown> | string | undefined, schema: Joi.Schema): A => {
  const { error, value } = schema.validate(message, VALIDATION_OPTIONS);
  if (error) {
    throw DecodeJsonError.fromJoiError(error);
  }
  return value;
};

export { Joi, validateSchema, validateSchemaWithThrow, isJoiError };
