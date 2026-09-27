import type { RefineTuple } from "./types";

export interface StrongPasswordMessages {
  generic?: string;
  tooShort?: string;
  tooLong?: string;
  missingUppercase?: string;
  missingLowercase?: string;
  missingDigit?: string;
  missingSpecialChar?: string;
  containsWhitespace?: string;
  repeatingChars?: string;
  invalidType?: string;
}

export interface StrongPasswordOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireDigit?: boolean;
  requireSpecialChar?: boolean;
  specialChars?: string;
  forbidWhitespace?: boolean;
  forbidRepeatingChars?: boolean;

  messages?: StrongPasswordMessages;
}

const DEFAULT_SPECIAL_CHARS = `!@#$%^&*()_+-=[]{};':"\\|,.<>/?`;

function toCharClassSource(chars: string): string {
  return chars.replace(/[\]\\^-]/g, "\\$&");
}

interface PasswordRule {
  test: (value: string) => boolean;
  message: string;
}

function buildRules(
  resolved: Required<Omit<StrongPasswordOptions, "messages">>,
  messages: StrongPasswordMessages,
): PasswordRule[] {
  const rules: PasswordRule[] = [
    {
      test: (v) => v.length >= resolved.minLength,
      message:
        messages.tooShort ??
        `Password must be at least ${resolved.minLength} characters`,
    },
    {
      test: (v) => v.length <= resolved.maxLength,
      message:
        messages.tooLong ??
        `Password must be at most ${resolved.maxLength} characters`,
    },
  ];

  if (resolved.requireUppercase) {
    rules.push({
      test: (v) => /[A-Z]/.test(v),
      message:
        messages.missingUppercase ??
        "Password must contain at least one uppercase letter",
    });
  }

  if (resolved.requireLowercase) {
    rules.push({
      test: (v) => /[a-z]/.test(v),
      message:
        messages.missingLowercase ??
        "Password must contain at least one lowercase letter",
    });
  }

  if (resolved.requireDigit) {
    rules.push({
      test: (v) => /[0-9]/.test(v),
      message:
        messages.missingDigit ?? "Password must contain at least one digit",
    });
  }

  if (resolved.requireSpecialChar) {
    const specialCharRegex = new RegExp(
      `[${toCharClassSource(resolved.specialChars)}]`,
    );
    rules.push({
      test: (v) => specialCharRegex.test(v),
      message:
        messages.missingSpecialChar ??
        "Password must contain at least one special character",
    });
  }

  if (resolved.forbidWhitespace) {
    rules.push({
      test: (v) => !/\s/.test(v),
      message:
        messages.containsWhitespace ?? "Password must not contain whitespace",
    });
  }

  if (resolved.forbidRepeatingChars) {
    rules.push({
      test: (v) => !/(.)\1{2,}/.test(v),
      message:
        messages.repeatingChars ??
        "Password must not contain 3 or more repeating characters in a row",
    });
  }

  return rules;
}

/**
 * Validates that a field meets a configurable password-strength policy.
 * The rules are evaluated in order and the *first* failure is what Zod
 * reports: the predicate writes that rule's message into the params
 * object before returning `false`. Zod reads that object when building
 * the issue — v3 reads `message`, v4 converts it to `error` at
 * construction and re-reads `error` — so the tuple stays a plain
 * `{ message, path }` and satisfies `RefineTuple`.
 *
 * Pass `options.messages` to override any individual rule's wording;
 * `messages.generic` is the fallback message.
 *
 * @example
 * .refine(
 *   ...createStrongPasswordRefiner<FormValues>('password', {
 *     minLength: 10,
 *     messages: { tooShort: "Use at least 10 characters" },
 *   })
 * )
 */
export function createStrongPasswordRefiner<T extends Record<string, unknown>>(
  field: keyof T & string,
  options: StrongPasswordOptions = {},
): RefineTuple<T> {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireDigit = true,
    requireSpecialChar = true,
    specialChars = DEFAULT_SPECIAL_CHARS,
    forbidWhitespace = true,
    forbidRepeatingChars = false,
    messages = {},
  } = options;

  if (minLength > maxLength) {
    throw new Error(
      `createStrongPasswordRefiner: minLength (${minLength}) cannot exceed maxLength (${maxLength})`,
    );
  }

  const rules = buildRules(
    {
      minLength,
      maxLength,
      requireUppercase,
      requireLowercase,
      requireDigit,
      requireSpecialChar,
      specialChars,
      forbidWhitespace,
      forbidRepeatingChars,
    },
    messages,
  );

  const failureMessage = (value: unknown): string | null => {
    if (typeof value !== "string") {
      return messages.invalidType ?? "Password must be a string";
    }
    return rules.find((rule) => !rule.test(value))?.message ?? null;
  };

  const params: { message: string; path: string[]; error?: string } = {
    message: messages.generic ?? "Password does not meet the requirements",
    path: [field],
  };

  return [
    (data) => {
      const first = failureMessage(data[field]);

      if (first !== null) {
        params.message = first;
        if (params.error !== undefined) {
          params.error = first;
        }
      }
      
      return first === null;
    },
    params,
  ];
}
