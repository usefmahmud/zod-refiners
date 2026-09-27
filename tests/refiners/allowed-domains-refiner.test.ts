import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createAllowedDomainsRefiner,
  type AllowedDomainsOptions,
} from "../../registry/allowed-domains-refiner";
import { runRefine } from "../helpers/refine";

type Form = { target: string };

const company: AllowedDomainsOptions = { domains: ["company.com"] };

function tuple(options: AllowedDomainsOptions = company, message?: string) {
  return createAllowedDomainsRefiner<Form>("target", options, message);
}

function check(
  value: unknown,
  options: AllowedDomainsOptions = company,
  message?: string,
) {
  return runRefine(tuple(options, message), {
    target: value,
  } as unknown as Form);
}

describe("createAllowedDomainsRefiner", () => {
  describe("tuple contract", () => {
    it("reports failures on the refined field with the default message", () => {
      const [, params] = tuple();
      expect(params.message).toBe("This domain isn't allowed");
      expect(params.path).toEqual(["target"]);
    });

    it("carries a custom message into the error params", () => {
      const [, params] = tuple(company, "Use your company email");
      expect(params.message).toBe("Use your company email");
      expect(params.path).toEqual(["target"]);
    });

    it("throws when domains is empty", () => {
      expect(() => tuple({ domains: [] })).toThrow(
        "createAllowedDomainsRefiner: `domains` must contain at least one entry",
      );
    });
  });

  describe("email source (default)", () => {
    it("accepts an email on an allowed domain", () => {
      expect(check("dev@company.com").ok).toBe(true);
    });

    it("accepts an email when its domain is one of several allowed", () => {
      const result = check("dev@company.io", {
        domains: ["company.com", "company.io"],
      });
      expect(result.ok).toBe(true);
    });

    it("rejects an email on a domain that is not allowed", () => {
      const result = check("dev@gmail.com");
      expect(result.ok).toBe(false);
      expect(result.message).toBe("This domain isn't allowed");
      expect(result.path).toEqual(["target"]);
    });

    it("rejects an email whose domain only contains an allowed one", () => {
      expect(check("dev@notcompany.com").ok).toBe(false);
    });

    it("rejects an email whose domain merely ends with an allowed one", () => {
      expect(check("dev@company.com.evil.com").ok).toBe(false);
    });

    it("matches domains case-insensitively by default", () => {
      expect(check("Dev@Company.COM").ok).toBe(true);
    });

    it("accepts an exact match when caseSensitive is true", () => {
      const result = check("user@Company.com", {
        domains: ["Company.com"],
        caseSensitive: true,
      });
      expect(result.ok).toBe(true);
    });

    it("rejects a differently cased domain when caseSensitive is true", () => {
      const result = check("user@company.com", {
        domains: ["Company.com"],
        caseSensitive: true,
      });
      expect(result.ok).toBe(false);
    });

    it("rejects a subdomain by default", () => {
      expect(check("dev@mail.company.com").ok).toBe(false);
    });

    it("accepts a subdomain when allowSubdomains is true", () => {
      const result = check("dev@mail.company.com", {
        domains: ["company.com"],
        allowSubdomains: true,
      });
      expect(result.ok).toBe(true);
    });

    it("accepts a deeply nested subdomain when allowSubdomains is true", () => {
      const result = check("dev@a.b.company.com", {
        domains: ["company.com"],
        allowSubdomains: true,
      });
      expect(result.ok).toBe(true);
    });

    it("keeps exact matches working when allowSubdomains is true", () => {
      const result = check("dev@company.com", {
        domains: ["company.com"],
        allowSubdomains: true,
      });
      expect(result.ok).toBe(true);
    });

    it("still rejects lookalike domains when allowSubdomains is true", () => {
      const result = check("dev@notcompany.com", {
        domains: ["company.com"],
        allowSubdomains: true,
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("email extraction", () => {
    it("rejects a value without an @ sign", () => {
      expect(check("company.com").ok).toBe(false);
    });

    it("rejects an email with an empty domain", () => {
      expect(check("user@").ok).toBe(false);
    });

    it("rejects an empty value", () => {
      expect(check("").ok).toBe(false);
    });

    it("extracts the domain after the last @ sign", () => {
      expect(check("weird@name@company.com").ok).toBe(true);
    });
  });

  describe("url source", () => {
    const url: AllowedDomainsOptions = {
      domains: ["company.com"],
      source: "url",
    };

    it("accepts a URL whose host is allowed", () => {
      expect(check("https://company.com/hooks", url).ok).toBe(true);
    });

    it("rejects a URL whose host is not allowed", () => {
      expect(check("https://evil.com/hook", url).ok).toBe(false);
    });

    it("rejects a lookalike host that ends with an allowed one", () => {
      expect(check("https://company.com.evil.com/", url).ok).toBe(false);
    });

    it("ignores the port when matching", () => {
      expect(check("https://company.com:8443/x", url).ok).toBe(true);
    });

    it("rejects a value that is not a parseable URL", () => {
      expect(check("not a url", url).ok).toBe(false);
    });

    it("rejects a subdomain URL by default", () => {
      expect(check("https://api.company.com/hook", url).ok).toBe(false);
    });

    it("accepts a subdomain URL when allowSubdomains is true", () => {
      const result = check("https://api.company.com/hook", {
        ...url,
        allowSubdomains: true,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("hostname source", () => {
    const hostname: AllowedDomainsOptions = {
      domains: ["company.com"],
      source: "hostname",
    };

    it("accepts an allowed hostname", () => {
      expect(check("company.com", hostname).ok).toBe(true);
    });

    it("rejects a hostname that is not allowed", () => {
      expect(check("evil.com", hostname).ok).toBe(false);
    });

    it("rejects a hostname that only ends with an allowed entry", () => {
      expect(check("notcompany.com", hostname).ok).toBe(false);
    });

    it("rejects a subdomain hostname by default", () => {
      expect(check("mail.company.com", hostname).ok).toBe(false);
    });

    it("accepts a subdomain hostname when allowSubdomains is true", () => {
      const result = check("mail.company.com", {
        ...hostname,
        allowSubdomains: true,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("non-string values", () => {
    it("rejects a missing field", () => {
      expect(check(undefined).ok).toBe(false);
    });

    it("rejects a non-string value", () => {
      expect(check(12345).ok).toBe(false);
    });
  });

  describe("zod integration", () => {
    const schema = z
      .object({ target: z.string() })
      .refine(...createAllowedDomainsRefiner<Form>("target", company));

    it("lets an allowed email parse", () => {
      const parsed = schema.safeParse({ target: "dev@company.com" });
      expect(parsed.success).toBe(true);
    });

    it("reports a disallowed domain on the field with the default message", () => {
      const parsed = schema.safeParse({ target: "dev@gmail.com" });
      expect(parsed.success).toBe(false);
      const issue = parsed.error!.issues[0];
      expect(issue.message).toBe("This domain isn't allowed");
      expect(issue.path).toEqual(["target"]);
    });

    it("applies options and a custom message through zod", () => {
      const webhook = z.object({ target: z.string() }).refine(
        ...createAllowedDomainsRefiner<Form>(
          "target",
          {
            domains: ["trusted-partner.com"],
            source: "url",
            allowSubdomains: true,
          },
          "Webhook host isn't trusted",
        ),
      );

      const ok = webhook.safeParse({
        target: "https://hooks.trusted-partner.com/events",
      });
      expect(ok.success).toBe(true);

      const bad = webhook.safeParse({ target: "https://evil.com/events" });
      expect(bad.success).toBe(false);
      const issue = bad.error!.issues[0];
      expect(issue.message).toBe("Webhook host isn't trusted");
      expect(issue.path).toEqual(["target"]);
    });
  });
});
