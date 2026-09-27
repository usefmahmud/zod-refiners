/**

* Configuration tuple for Zod's `.refine(...)` method.
*
* The tuple is designed to be passed directly using the spread operator:
*
* @example
* .refine(...createXRefiner(field, ...args, label))
*
* The first element is the validation predicate, which receives the
* complete parsed object and returns `true` when the data is valid.
*
* The second element defines the validation error message and the field
* path where the error should be reported.
  */
export type RefineTuple<T> = [
  (data: T) => boolean,
  { message: string; path: string[] },
];
