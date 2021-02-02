export type Nullable<T> = { [P in keyof T]: T[P] | null };

export type NonNullable<T> = Exclude<T, null | undefined>;
