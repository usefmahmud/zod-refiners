import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createStrongPasswordRefiner,
  type StrongPasswordOptions,
} from "../../registry/create-strong-password-refiner";
import { runRefine } from "../helpers/refine";

type LoginForm = { password: string };

function tuple(options?: StrongPasswordOptions) {
  return createStrongPasswordRefiner<LoginForm>("password", options);
}

function check(password: unknown, options?: StrongPasswordOptions) {
  return runRefine(tuple(options), { password } as unknown as LoginForm);
}

describe("createStrongPasswordRefiner", () => {
  describe("tuple contract", () => {
    it("starts at the generic message before validation runs", () => {
      const [, params] = tuple({
        messages: { generic: "Pick a stronger password" },
      });
      expect(params.message).toBe("Pick a stronger password");
    });
  });

  describe("default policy", () => {
    const accepted = ["Str0ng!Pass", "Tr0ub4dor&3", "p@ssw0rdX"];

    it.each(accepted)("accepts %s", (password) => {
      expect(check(password).ok).toBe(true);
    });

    const rejected: Array<[string, unknown, string]> = [
      [
        "a password that is too short",
        "Aa1!aaa",
        "Password must be at least 8 characters",
      ],
      [
        "a password that is too long",
        "Aa1!" + "a".repeat(125),
        "Password must be at most 128 characters",
      ],
      [
        "a password without an uppercase letter",
        "ab1!abcd",
        "Password must contain at least one uppercase letter",
      ],
      [
        "a password without a lowercase letter",
        "AB1!ABCD",
        "Password must contain at least one lowercase letter",
      ],
      [
        "a password without a digit",
        "Abc!defg",
        "Password must contain at least one digit",
      ],
      [
        "a password without a special character",
        "Abc1defg",
        "Password must contain at least one special character",
      ],
      [
        "a password containing whitespace",
        "Str0ng! Pass",
        "Password must not contain whitespace",
      ],
      ["a non-string value", 42, "Password must be a string"],
      ["a missing field", undefined, "Password must be a string"],
    ];

    it.each(rejected)("rejects %s", (_label, password, message) => {
      const result = check(password);
      expect(result.ok).toBe(false);
      expect(result.message).toBe(message);
      expect(result.path).toEqual(["password"]);
    });

    it("reports the first failing rule when several rules fail", () => {
      expect(check("abc").message).toBe(
        "Password must be at least 8 characters",
      );
    });

    it("checks length before character classes", () => {
      expect(check("a".repeat(129)).message).toBe(
        "Password must be at most 128 characters",
      );
    });
  });

  describe("length options", () => {
    it("enforces a custom minLength", () => {
      const result = check("Ab1!abcd", { minLength: 12 });
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Password must be at least 12 characters");
    });

    it("allows minLength equal to maxLength", () => {
      const options = { minLength: 8, maxLength: 8 };
      expect(check("Ab1!abcd", options).ok).toBe(true);

      const over = check("Ab1!abcde", options);
      expect(over.ok).toBe(false);
      expect(over.message).toBe("Password must be at most 8 characters");
    });

    it("throws when minLength exceeds maxLength", () => {
      expect(() => tuple({ minLength: 10, maxLength: 5 })).toThrow(
        "createStrongPasswordRefiner: minLength (10) cannot exceed maxLength (5)",
      );
    });
  });

  describe("rule toggles", () => {
    it("skips disabled character-class rules", () => {
      expect(check("ab1!abcd", { requireUppercase: false }).ok).toBe(true);
    });

    it("accepts a weak password when every rule is disabled", () => {
      const result = check("password", {
        requireUppercase: false,
        requireLowercase: false,
        requireDigit: false,
        requireSpecialChar: false,
        forbidWhitespace: false,
      });
      expect(result.ok).toBe(true);
    });

    it("allows repeating characters by default", () => {
      expect(check("Passw0rd!!!").ok).toBe(true);
    });

    it("rejects three or more repeating characters when enabled", () => {
      const options = { forbidRepeatingChars: true };
      const result = check("Passw0rd!!!", options);
      expect(result.ok).toBe(false);
      expect(result.message).toBe(
        "Password must not contain 3 or more repeating characters in a row",
      );
      expect(check("Passw0rd!!x", options).ok).toBe(true);
    });
  });

  describe("custom special characters", () => {
    const options = { specialChars: "^]-" };

    it("accepts a password containing a character from the custom set", () => {
      expect(check("Ab1^defg", options).ok).toBe(true);
    });

    it("rejects a password whose special character is not in the set", () => {
      const result = check("Ab1!defg", options);
      expect(result.ok).toBe(false);
      expect(result.message).toBe(
        "Password must contain at least one special character",
      );
    });
  });

  describe("custom messages", () => {
    it("uses an overridden rule message", () => {
      const result = check("Ab1!aaa", {
        messages: { tooShort: "Come up with a longer password" },
      });
      expect(result.message).toBe("Come up with a longer password");
    });

    it("uses an overridden invalid-type message", () => {
      const result = check(42, {
        messages: { invalidType: "Password field must be text" },
      });
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Password field must be text");
    });
  });

  describe("zod integration", () => {
    const schema = z
      .object({ password: z.string() })
      .refine(...createStrongPasswordRefiner<LoginForm>("password"));

    it("lets valid data parse", () => {
      expect(schema.safeParse({ password: "Str0ng!Pass" }).success).toBe(true);
    });

    it("reports the failing rule on the field path", () => {
      const parsed = schema.safeParse({ password: "abc" });
      expect(parsed.success).toBe(false);
      const issue = parsed.error!.issues[0];
      expect(issue.message).toBe("Password must be at least 8 characters");
      expect(issue.path).toEqual(["password"]);
    });
  });
});
