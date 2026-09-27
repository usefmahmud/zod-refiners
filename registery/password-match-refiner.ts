import type { RefineTuple } from "./types";

/**
 * Validates that two fields contain the same value.
 *
 * Intended for confirmation fields such as `confirmPassword`.
 * When the values differ, the validation error is assigned to the
 * confirmation field rather than the original field.
 *
 * @example
 * .refine(
 *   ...createPasswordMatchRefiner<FormValues>('password', 'confirmPassword')
 * )
 */
export function createPasswordMatchRefiner<T extends Record<string, unknown>>(
  passwordField: keyof T & string,
  confirmField: keyof T & string,
  message = "Passwords don't match",
): RefineTuple<T> {
  return [
    (data) => data[passwordField] === data[confirmField],
    { message, path: [confirmField] },
  ];
}
