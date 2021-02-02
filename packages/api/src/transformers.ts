import { Identity, Utils } from '@monots/shared';

export const transformDbIdentity = (row: Record<string, any>): Identity =>
  Utils.removeUndefinedOrNullFields({
    id: row.id,
    name: row.name,
    description: row.description,
    dob: row.dob,
    createdAt: row.created_at,
  });
