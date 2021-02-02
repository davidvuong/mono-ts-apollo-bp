import { Identity, Utils } from '@monots/shared';

export const transformDbIdentity = (row: any): Identity =>
  Utils.removeUndefinedOrNullFields({
    id: row.id,
    name: row.name,
    description: row.description,
    dob: row.dob,
    createdAt: row.created_at,
  });
