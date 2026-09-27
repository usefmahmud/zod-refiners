import type { RefineTuple } from "./types";

export type AllowedDomainsSource = "email" | "url" | "hostname";

export interface AllowedDomainsOptions {
  domains: string[];
  source?: AllowedDomainsSource;
  caseSensitive?: boolean;

  allowSubdomains?: boolean;
}

function extractDomain(
  value: string,
  source: AllowedDomainsSource,
): string | null {
  switch (source) {
    case "email": {
      const at = value.lastIndexOf("@");
      if (at === -1 || at === value.length - 1) return null;

      return value.slice(at + 1);
    }
    case "url": {
      try {
        return new URL(value).hostname;
      } catch {
        return null;
      }
    }
    case "hostname":
      return value;
  }
}

function isDomainAllowed(
  domain: string,
  allowed: string[],
  caseSensitive: boolean,
  allowSubdomains: boolean,
): boolean {
  const normalize = (d: string) => (caseSensitive ? d : d.toLowerCase());
  const target = normalize(domain);

  return allowed.some((entry) => {
    const normalizedEntry = normalize(entry);
    if (target === normalizedEntry) return true;

    return allowSubdomains && target.endsWith(`.${normalizedEntry}`);
  });
}

/**
 * Validates that a field's email, URL, or hostname belongs to an
 * allowed set of domains.
 *
 * Common real-world uses:
 * - Restrict signup/invite emails to a company's own domain(s) on an
 *   internal or B2B tool (`source: "email"`).
 * - Restrict user-supplied webhook/callback URLs to a known allowlist,
 *   as a defense against SSRF (`source: "url"`).
 * - Restrict avatar/asset URLs to trusted CDN hostnames only.
 *
 * @example
 * .refine(
 *   ...createAllowedDomainsRefiner<FormValues>('workEmail', {
 *     domains: ['company.com', 'company.io'],
 *   })
 * )
 *
 * @example
 * // Webhook URL allowlist, permitting subdomains
 * .refine(
 *   ...createAllowedDomainsRefiner<FormValues>('webhookUrl', {
 *     domains: ['trusted-partner.com'],
 *     source: 'url',
 *     allowSubdomains: true,
 *   })
 * )
 */
export function createAllowedDomainsRefiner<T extends Record<string, unknown>>(
  field: keyof T & string,
  options: AllowedDomainsOptions,
  message = "This domain isn't allowed",
): RefineTuple<T> {
  const {
    domains,
    source = "email",
    caseSensitive = false,
    allowSubdomains = false,
  } = options;

  if (domains.length === 0) {
    throw new Error(
      "createAllowedDomainsRefiner: `domains` must contain at least one entry",
    );
  }

  return [
    (data) => {
      const value = data[field];
      if (typeof value !== "string") return false;

      const domain = extractDomain(value, source);
      if (!domain) return false;

      return isDomainAllowed(domain, domains, caseSensitive, allowSubdomains);
    },
    { message, path: [field] },
  ];
}
