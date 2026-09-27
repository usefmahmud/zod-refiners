import type { RefineTuple } from "../../registry/types";

export interface RefineOutcome {
  ok: boolean;
  message: string;
  path: string[];
}

/**
 * Runs a refiner tuple the way Zod does: invoke the predicate against the
 * whole data object, then read the params it may have updated.
 *
 * Every refiner test uses this so new refiners only need a test file in
 * `tests/refiners/`.
 */
export function runRefine<T>(tuple: RefineTuple<T>, data: T): RefineOutcome {
  const [predicate, params] = tuple;
  return {
    ok: predicate(data),
    message: params.message,
    path: [...params.path],
  };
}
