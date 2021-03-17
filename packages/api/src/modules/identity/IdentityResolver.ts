import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { Service } from 'typedi';
import { IdentityService } from './IdentityService';
import { Identity } from './typed/Identity';
import { IdentityCreateInput } from './typed/IdentityCreateInput';

@Service()
@Resolver(of => Identity)
export class IdentityResolver {
  constructor(private readonly identityService: IdentityService) {}

  @Query(returns => [Identity])
  async identities(): Promise<Identity[]> {
    return this.identityService.getAll();
  }

  @Mutation(returns => Identity)
  async createIdentity(@Arg('data') data: IdentityCreateInput, @Ctx() ctx: any): Promise<Identity> {
    return this.identityService.create(data);
  }
}
