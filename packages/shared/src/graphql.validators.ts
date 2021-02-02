import { Joi, validateSchema } from './common/joi';
import { CreateIdentityInput } from './graphql.generated';

// Joi Schema definitions

export const IdentitySchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(128).required(),
  dob: Joi.string().isoDate().required(),
  description: Joi.string().max(1024),
});

// Validators

export const validateCreateIdentityInput = (input: any): Promise<CreateIdentityInput> =>
  validateSchema(
    input,
    Joi.object({
      name: Joi.string().min(1).max(128).required(),
      dob: Joi.string().isoDate().required(),
      description: Joi.string().max(1024),
    }),
  );
