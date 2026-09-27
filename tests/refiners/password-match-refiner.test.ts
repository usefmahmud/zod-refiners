import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createPasswordMatchRefiner } from "../../registry/password-match-refiner";
import { runRefine } from "../helpers/refine";

type SignUpForm = {
  password: string;
  confirmPassword: string;
};

function tuple(
  passwordField: keyof SignUpForm = "password",
  confirmField: keyof SignUpForm = "confirmPassword",
  message?: string,
) {
  return createPasswordMatchRefiner<SignUpForm>(
    passwordField,
    confirmField,
    message,
  );
}

function check(
  password: unknown,
  confirmPassword: unknown,
  message?: string,
) {
  return runRefine(
    tuple("password", "confirmPassword", message),
    { password, confirmPassword } as unknown as SignUpForm,
  );
}

describe("createPasswordMatchRefiner", () => {
  describe("tuple contract", () => {
    it("starts at the default message before validation runs", () => {
      const [, params] = tuple();
      expect(params.message).toBe("Passwords don't match");
      expect(params.path).toEqual(["confirmPassword"]);
    });

    it("uses a custom message when provided", () => {
      const [, params] = tuple("password", "confirmPassword", "Nope");
      expect(params.message).toBe("Nope");
    });
  });

  describe("matching behavior", () => {
    it("accepts identical values", () => {
      expect(check("hunter2", "hunter2").ok).toBe(true);
    });

    it("accepts identical empty strings", () => {
      expect(check("", "").ok).toBe(true);
    });

    it("accepts identical non-string values", () => {
      expect(check(12345, 12345).ok).toBe(true);
    });

    it("rejects different values", () => {
      const result = check("hunter2", "hunter3");
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Passwords don't match");
      expect(result.path).toEqual(["confirmPassword"]);
    });

    it("rejects when only one field is missing", () => {
      const result = check("hunter2", undefined);
      expect(result.ok).toBe(false);
      expect(result.path).toEqual(["confirmPassword"]);
    });

    it("is case sensitive", () => {
      expect(check("Secret", "secret").ok).toBe(false);
    });
  });

  describe("error placement", () => {
    it("reports the error on the confirm field, not the password field", () => {
      const result = check("abc", "def");
      expect(result.path).toEqual(["confirmPassword"]);
      expect(result.path).not.toContain("password");
    });

    it("reports the error on a custom confirm field", () => {
      const [, params] = tuple("password", "confirmEmail" as keyof SignUpForm);
      expect(params.path).toEqual(["confirmEmail"]);
    });

    it("uses a custom failure message", () => {
      const result = check("abc", "def", "The two passwords must match");
      expect(result.ok).toBe(false);
      expect(result.message).toBe("The two passwords must match");
    });
  });

  describe("zod integration", () => {
    const schema = z
      .object({ password: z.string(), confirmPassword: z.string() })
      .refine(...createPasswordMatchRefiner<SignUpForm>("password", "confirmPassword"));

    it("lets matching data parse", () => {
      const parsed = schema.safeParse({
        password: "hunter2",
        confirmPassword: "hunter2",
      });
      expect(parsed.success).toBe(true);
    });

    it("reports the mismatch on the confirm field path", () => {
      const parsed = schema.safeParse({
        password: "hunter2",
        confirmPassword: "hunter3",
      });
      expect(parsed.success).toBe(false);
      const issue = parsed.error!.issues[0];
      expect(issue.message).toBe("Passwords don't match");
      expect(issue.path).toEqual(["confirmPassword"]);
    });

    it("supports a custom message through zod", () => {
      const custom = z
        .object({ password: z.string(), confirmPassword: z.string() })
        .refine(
          ...createPasswordMatchRefiner<SignUpForm>(
            "password",
            "confirmPassword",
            "Must match the password",
          ),
        );
      const parsed = custom.safeParse({
        password: "a",
        confirmPassword: "b",
      });
      expect(parsed.success).toBe(false);
      expect(parsed.error!.issues[0].message).toBe("Must match the password");
    });
  });
});
