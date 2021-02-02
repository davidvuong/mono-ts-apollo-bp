import { Resolvers, validateCreateIdentityInput } from '@monots/shared';
import { UserInputError } from 'apollo-server-express';
import { IdentityService } from './services/identity';

const validateInput = async <A>(input: A, validationFn: (payload: A) => Promise<A>): Promise<A> => {
  try {
    return await validationFn(input);
  } catch (err) {
    throw new UserInputError(err.message);
  }
};

export const loadResolvers = (identityService: IdentityService): Resolvers => ({
  Query: {
    identities: (_root, _args, _context) => identityService.getAll(),
  },
  Mutation: {
    createIdentity: async (_root, args, _context) =>
      identityService.create(await validateInput(args.input, validateCreateIdentityInput)),
  },
});
