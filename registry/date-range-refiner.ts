import type { RefineTuple } from "./types";

export interface DateRangeMessages {
  datesRequired?: string;
  invalidDate?: string;
  endNotAfterStart?: string;
}

export interface DateRangeOptions {
  allowEqual?: boolean;
  granularity?: "date" | "datetime";

  errorField?: "start" | "end";

  messages?: DateRangeMessages;
}

/**
 * Validates that an end date does not come before a start date.
 *
 * Missing values and non-`Date` values fail with their own messages and
 * are reported on the offending field; ordering failures are reported on
 * `options.errorField` (the end field by default). With the default
 * `"date"` granularity the comparison uses local calendar days, so
 * `start = 2026-01-01T18:00` and `end = 2026-01-02T09:00` is a valid
 * range, while a same-day range only passes when `allowEqual` is set.
 *
 * The predicate writes the failure message into the params object before
 * returning `false` (also updating `error`, which is what Zod v4 reads),
 * and points `params.path` at the offending field by mutating the array
 * in place — Zod v4 captured that array when `.refine(...)` ran.
 *
 * @example
 * .refine(
 *   ...createDateRangeRefiner<FormValues>('startDate', 'endDate', {
 *     allowEqual: true,
 *     granularity: 'datetime',
 *   })
 * )
 */
export function createDateRangeRefiner<T extends Record<string, unknown>>(
  startField: keyof T & string,
  endField: keyof T & string,
  options: DateRangeOptions = {},
): RefineTuple<T> {
  const {
    allowEqual = false,
    granularity = "date",
    errorField = "end",
    messages = {},
  } = options;

  if (startField === endField) {
    throw new Error(
      "createDateRangeRefiner: startField and endField must be different fields",
    );
  }

  const orderingMessage =
    messages.endNotAfterStart ??
    (allowEqual
      ? "End date must be on or after start date"
      : "End date must be after start date");
  const orderingField = errorField === "start" ? startField : endField;

  const params: { message: string; path: string[]; error?: string } = {
    message: orderingMessage,
    path: [orderingField],
  };

  const fail = (message: string, field: string): false => {
    params.message = message;

    if (params.error !== undefined) {
      params.error = message;
    }

    params.path[0] = field;
    return false;
  };

  const isDate = (value: unknown): value is Date =>
    value instanceof Date && !Number.isNaN(value.getTime());

  const compare = (start: Date, end: Date): number => {
    if (granularity === "datetime") {
      return end.getTime() - start.getTime();
    }
    return (
      end.getFullYear() - start.getFullYear() ||
      end.getMonth() - start.getMonth() ||
      end.getDate() - start.getDate()
    );
  };

  return [
    (data) => {
      const start = data[startField];
      const end = data[endField];

      if (start == null) {
        return fail(
          messages.datesRequired ?? "Start and end dates are required",
          startField,
        );
      }

      if (end == null) {
        return fail(
          messages.datesRequired ?? "Start and end dates are required",
          endField,
        );
      }

      if (!isDate(start)) {
        return fail(messages.invalidDate ?? "Invalid date", startField);
      }

      if (!isDate(end)) {
        return fail(messages.invalidDate ?? "Invalid date", endField);
      }

      const diff = compare(start, end);
      if (diff > 0 || (allowEqual && diff === 0)) {
        return true;
      }

      return fail(orderingMessage, orderingField);
    },
    params,
  ];
}
