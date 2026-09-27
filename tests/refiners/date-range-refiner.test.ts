import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createDateRangeRefiner,
  type DateRangeOptions,
} from "../../registry/date-range-refiner";
import { runRefine } from "../helpers/refine";

type BookingForm = {
  startDate: Date;
  endDate: Date;
};

function tuple(
  options?: DateRangeOptions,
  startField: keyof BookingForm = "startDate",
  endField: keyof BookingForm = "endDate",
) {
  return createDateRangeRefiner<BookingForm>(startField, endField, options);
}

function check(start: unknown, end: unknown, options?: DateRangeOptions) {
  return runRefine(tuple(options), {
    startDate: start,
    endDate: end,
  } as unknown as BookingForm);
}

const day = (year: number, month: number, dayOfMonth: number) =>
  new Date(year, month - 1, dayOfMonth);
const at = (
  year: number,
  month: number,
  dayOfMonth: number,
  hour: number,
  minute = 0,
) => new Date(year, month - 1, dayOfMonth, hour, minute);

describe("createDateRangeRefiner", () => {
  describe("tuple contract", () => {
    it("starts at the ordering message before validation runs", () => {
      const [, params] = tuple();
      expect(params.message).toBe("End date must be after start date");
      expect(params.path).toEqual(["endDate"]);
    });

    it("seeds the initial message from a custom ordering message", () => {
      const [, params] = tuple({
        messages: { endNotAfterStart: "Check the range" },
      });
      expect(params.message).toBe("Check the range");
    });

    it("throws when startField and endField are the same", () => {
      expect(() => tuple(undefined, "startDate", "startDate")).toThrow(
        "createDateRangeRefiner: startField and endField must be different fields",
      );
    });
  });

  describe("missing dates", () => {
    it("rejects a missing start date", () => {
      const result = check(undefined, day(2026, 1, 2));
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Start and end dates are required");
      expect(result.path).toEqual(["startDate"]);
    });

    it("rejects a missing end date", () => {
      const result = check(day(2026, 1, 1), undefined);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Start and end dates are required");
      expect(result.path).toEqual(["endDate"]);
    });

    it("treats null as missing", () => {
      const result = check(day(2026, 1, 1), null);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Start and end dates are required");
      expect(result.path).toEqual(["endDate"]);
    });

    it("uses an overridden missing-dates message", () => {
      const result = check(undefined, day(2026, 1, 2), {
        messages: { datesRequired: "Pick both dates" },
      });
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Pick both dates");
    });

    it("reports the missing field even when errorField points elsewhere", () => {
      const result = check(undefined, day(2026, 1, 2), {
        errorField: "end",
      });
      expect(result.path).toEqual(["startDate"]);
    });
  });

  describe("invalid dates", () => {
    it("rejects a start date that is not a Date instance", () => {
      const result = check("2026-01-01", day(2026, 1, 2));
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Invalid date");
      expect(result.path).toEqual(["startDate"]);
    });

    it("rejects an end date that is not a Date instance", () => {
      const result = check(day(2026, 1, 1), 12345);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Invalid date");
      expect(result.path).toEqual(["endDate"]);
    });

    it("rejects an Invalid Date", () => {
      const result = check(day(2026, 1, 1), new Date(Number.NaN));
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Invalid date");
      expect(result.path).toEqual(["endDate"]);
    });

    it("uses an overridden invalid-date message", () => {
      const result = check(day(2026, 1, 1), "nope", {
        messages: { invalidDate: "That is not a date" },
      });
      expect(result.ok).toBe(false);
      expect(result.message).toBe("That is not a date");
    });
  });

  describe("date granularity (default)", () => {
    it("accepts an end date after the start date", () => {
      expect(check(day(2026, 1, 1), day(2026, 1, 2)).ok).toBe(true);
    });

    it("accepts a multi-day range", () => {
      expect(check(day(2026, 1, 1), day(2026, 3, 15)).ok).toBe(true);
    });

    it("rejects an end date before the start date", () => {
      const result = check(day(2026, 1, 2), day(2026, 1, 1));
      expect(result.ok).toBe(false);
      expect(result.message).toBe("End date must be after start date");
      expect(result.path).toEqual(["endDate"]);
    });

    it("rejects the same calendar day by default", () => {
      const result = check(day(2026, 1, 1), day(2026, 1, 1));
      expect(result.ok).toBe(false);
      expect(result.message).toBe("End date must be after start date");
    });

    it("rejects the same calendar day even when times differ", () => {
      const result = check(at(2026, 1, 1, 10), at(2026, 1, 1, 15));
      expect(result.ok).toBe(false);
      expect(result.message).toBe("End date must be after start date");
    });

    it("compares calendar days, not timestamps, across midnight", () => {
      expect(check(at(2026, 1, 1, 18), at(2026, 1, 2, 9)).ok).toBe(true);
    });

    it("accepts the same calendar day when allowEqual is true", () => {
      const result = check(day(2026, 1, 1), day(2026, 1, 1), {
        allowEqual: true,
      });
      expect(result.ok).toBe(true);
    });

    it("still rejects a reversed range when allowEqual is true", () => {
      const result = check(day(2026, 1, 2), day(2026, 1, 1), {
        allowEqual: true,
      });
      expect(result.ok).toBe(false);
      expect(result.message).toBe(
        "End date must be on or after start date",
      );
    });
  });

  describe("datetime granularity", () => {
    const options: DateRangeOptions = { granularity: "datetime" };

    it("accepts a later time on the same day", () => {
      expect(
        check(at(2026, 1, 1, 10), at(2026, 1, 1, 15), options).ok,
      ).toBe(true);
    });

    it("rejects an earlier time on the same day", () => {
      const result = check(
        at(2026, 1, 1, 15),
        at(2026, 1, 1, 10),
        options,
      );
      expect(result.ok).toBe(false);
      expect(result.message).toBe("End date must be after start date");
    });

    it("rejects identical timestamps by default", () => {
      const result = check(
        at(2026, 1, 1, 10),
        at(2026, 1, 1, 10),
        options,
      );
      expect(result.ok).toBe(false);
      expect(result.message).toBe("End date must be after start date");
    });

    it("accepts identical timestamps when allowEqual is true", () => {
      expect(
        check(at(2026, 1, 1, 10), at(2026, 1, 1, 10), {
          ...options,
          allowEqual: true,
        }).ok,
      ).toBe(true);
    });

    it("accepts a later timestamp on a later day", () => {
      expect(
        check(at(2026, 1, 1, 23), at(2026, 1, 2, 0, 1), options).ok,
      ).toBe(true);
    });
  });

  describe("error placement", () => {
    it("reports ordering errors on the end field by default", () => {
      const result = check(day(2026, 1, 2), day(2026, 1, 1));
      expect(result.path).toEqual(["endDate"]);
    });

    it("reports ordering errors on the start field when configured", () => {
      const result = check(day(2026, 1, 2), day(2026, 1, 1), {
        errorField: "start",
      });
      expect(result.ok).toBe(false);
      expect(result.path).toEqual(["startDate"]);
    });

    it("uses a custom ordering message", () => {
      const result = check(day(2026, 1, 2), day(2026, 1, 1), {
        messages: { endNotAfterStart: "Check your dates" },
      });
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Check your dates");
    });
  });

  describe("zod integration", () => {
    const schema = z
      .object({ startDate: z.date(), endDate: z.date() })
      .refine(
        ...createDateRangeRefiner<BookingForm>("startDate", "endDate"),
      );

    it("lets a valid range parse", () => {
      const parsed = schema.safeParse({
        startDate: day(2026, 1, 1),
        endDate: day(2026, 1, 2),
      });
      expect(parsed.success).toBe(true);
    });

    it("reports a reversed range on the end field", () => {
      const parsed = schema.safeParse({
        startDate: day(2026, 1, 2),
        endDate: day(2026, 1, 1),
      });
      expect(parsed.success).toBe(false);
      const issue = parsed.error!.issues[0];
      expect(issue.message).toBe("End date must be after start date");
      expect(issue.path).toEqual(["endDate"]);
    });

    it("reports a missing field through zod for optional fields", () => {
      type OptionalRange = { startDate?: Date; endDate?: Date };
      const optional = z
        .object({ startDate: z.date().optional(), endDate: z.date().optional() })
        .refine(
          ...createDateRangeRefiner<OptionalRange>("startDate", "endDate"),
        );
      const parsed = optional.safeParse({
        startDate: day(2026, 1, 1),
        endDate: undefined,
      });
      expect(parsed.success).toBe(false);
      const issue = parsed.error!.issues[0];
      expect(issue.message).toBe("Start and end dates are required");
      expect(issue.path).toEqual(["endDate"]);
    });

    it("supports options through zod", () => {
      const inclusive = z
        .object({ startDate: z.date(), endDate: z.date() })
        .refine(
          ...createDateRangeRefiner<BookingForm>("startDate", "endDate", {
            allowEqual: true,
            errorField: "start",
            granularity: "datetime",
            messages: {
              datesRequired: "Both dates needed",
              invalidDate: "Not a date",
              endNotAfterStart: "End must follow start",
            },
          }),
        );

      const sameDay = inclusive.safeParse({
        startDate: at(2026, 1, 1, 9),
        endDate: at(2026, 1, 1, 9),
      });
      expect(sameDay.success).toBe(true);

      const reversed = inclusive.safeParse({
        startDate: day(2026, 1, 2),
        endDate: day(2026, 1, 1),
      });
      expect(reversed.success).toBe(false);
      const issue = reversed.error!.issues[0];
      expect(issue.message).toBe("End must follow start");
      expect(issue.path).toEqual(["startDate"]);
    });
  });
});
