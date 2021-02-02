import { omitBy, isNil } from 'lodash';

function map<A, B>(a: A[], f: (x: A, i: number) => Promise<B>): Promise<B[]>;
function map<A, B>(a: A[], f: (x: A) => Promise<B>): Promise<B[]>;
function map<A, B>(a: A[], f: ((x: A) => Promise<B>) & ((x: A, i: number) => Promise<B>)): Promise<B[]> {
  return Promise.all(a.map(f));
}

const removeUndefinedOrNullFields = <T extends Record<string, unknown>>(object: T): T => omitBy(object, isNil) as T;

const removeEmptyStringFields = <T extends Record<string, unknown>>(object: T): T =>
  omitBy(object, val => val === '') as T;

export const Utils = {
  map,
  removeUndefinedOrNullFields,
  removeEmptyStringFields,
};
