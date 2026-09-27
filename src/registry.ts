import path from "node:path";
import fs from "fs-extra";
import prompts from "prompts";
import pc from "picocolors";

export interface RegistryEntry {
  name: string;
  description: string;
  files: string[];
  registryDependencies: string[];
}

export const REGISTRY_DIR = path.join(__dirname, "..", "registry");
export const REGISTRY_MANIFEST = path.join(REGISTRY_DIR, "index.json");

export async function loadManifest(): Promise<RegistryEntry[]> {
  return fs.readJson(REGISTRY_MANIFEST);
}

/** Thrown by `resolveClosure` when a requested or transitive dependency name isn't in the manifest. */
export class UnknownRefinerError extends Error {
  constructor(public readonly name: string) {
    super(`Unknown refiner "${name}"`);
  }
}

/** Thrown by `resolveClosure` when `registryDependencies` form a cycle. */
export class CircularDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Circular refiner dependency: ${cycle.join(" -> ")}`);
  }
}

export function resolveClosure(
  names: string[],
  manifest: RegistryEntry[],
): RegistryEntry[] {
  const byName = new Map(manifest.map((entry) => [entry.name, entry]));
  const resolved = new Set<string>();
  const inProgress = new Set<string>();
  const ordered: RegistryEntry[] = [];

  function visit(name: string, chain: string[]): void {
    if (resolved.has(name)) return;
    if (inProgress.has(name)) {
      throw new CircularDependencyError([...chain, name]);
    }

    const entry = byName.get(name);
    if (!entry) {
      throw new UnknownRefinerError(name);
    }

    inProgress.add(name);
    for (const dep of entry.registryDependencies) {
      visit(dep, [...chain, name]);
    }
    inProgress.delete(name);

    resolved.add(name);
    ordered.push(entry);
  }

  for (const name of names) visit(name, []);
  return ordered;
}

function reportResolveError(error: unknown): void {
  if (error instanceof UnknownRefinerError) {
    console.error(
      pc.red(
        `Unknown refiner "${error.name}". Run "zod-refiners list" to see options.`,
      ),
    );
  } else if (error instanceof CircularDependencyError) {
    console.error(
      pc.red(`Circular refiner dependency: ${error.cycle.join(" -> ")}`),
    );
  } else {
    throw error;
  }
  process.exitCode = 1;
}

export function resolveClosureOrReport(
  names: string[],
  manifest: RegistryEntry[],
): RegistryEntry[] | null {
  try {
    return resolveClosure(names, manifest);
  } catch (error) {
    reportResolveError(error);
    return null;
  }
}

export async function copyEntry(
  entry: RegistryEntry,
  targetDir: string,
): Promise<void> {
  await fs.ensureDir(targetDir);

  for (const file of entry.files) {
    const src = path.join(REGISTRY_DIR, file);
    const dest = path.join(targetDir, file);
    const relativeDest = path.relative(process.cwd(), dest);

    if (await fs.pathExists(dest)) {
      const { overwrite } = await prompts({
        type: "confirm",
        name: "overwrite",
        message: `${relativeDest} already exists. Overwrite?`,
        initial: false,
      });

      if (!overwrite) {
        console.log(pc.yellow(`Skipped ${file}`));
        continue;
      }
    }

    await fs.copy(src, dest);
    console.log(pc.green(`Added ${relativeDest}`));
  }
}
