import { PoolClient } from 'pg';
import { Service, Inject } from 'typedi';
import { v4 } from 'uuid';
import { Repository } from '../../repository';
import { transformDbIdentity } from './IdentityTransformers';
import { Identity } from './typed/Identity';
import { IdentityCreateInput } from './typed/IdentityCreateInput';

@Service()
export class IdentityService {
  constructor(@Inject('repository') private readonly repository: Repository) {}

  create = (args: IdentityCreateInput, transaction?: PoolClient): Promise<Identity> =>
    this.repository.create(
      {
        tableName: 'identities',
        resource: { ...args, id: v4() },
        transformer: transformDbIdentity,
      },
      transaction,
    );

  getAll = (transaction?: PoolClient): Promise<Identity[]> =>
    this.repository.getAll({ tableName: 'identities', transformer: transformDbIdentity }, transaction);

  deleteAll = (transaction?: PoolClient): Promise<void> =>
    this.repository.deleteAll({ tableName: 'identities' }, transaction);
}
