import { CreateIdentityInput, Identity } from '@monots/shared';
import { PoolClient } from 'pg';
import { v4 } from 'uuid';
import { Repository } from '../repository';
import { transformDbIdentity } from '../transformers';

export class IdentityService {
  constructor(private readonly repository: Repository) {}

  create = (args: CreateIdentityInput, transaction?: PoolClient): Promise<Identity> =>
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
