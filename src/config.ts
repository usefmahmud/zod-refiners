import path from "node:path";
import fs from "fs-extra";
import prompts from "prompts";

const CONFIG_FILENAME = "zod-refiners.json";
const DEFAULT_REFINERS_DIR = "src/lib/refiners";

export interface ZodRefinersConfig {
  refinersDir: string;
}

export function getConfigPath(cwd: string): string {
  return path.join(cwd, CONFIG_FILENAME);
}

export async function readConfig(
  cwd: string,
): Promise<ZodRefinersConfig | null> {
  const configPath = getConfigPath(cwd);

  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  try {
    return await fs.readJson(configPath);
  } catch (error) {
    throw new Error(
      `Failed to parse config at "${configPath}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export async function writeConfig(
  cwd: string,
  config: ZodRefinersConfig,
): Promise<void> {
  const configPath = getConfigPath(cwd);

  try {
    await fs.writeJson(configPath, config, { spaces: 2 });
  } catch (error) {
    throw new Error(
      `Failed to write config to "${configPath}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export async function ensureConfig(cwd: string): Promise<ZodRefinersConfig> {
  const existing = await readConfig(cwd);

  if (existing) return existing;

  const { refinersDir } = await prompts({
    type: "text",
    name: "refinersDir",
    message: "Where should refiner files be installed?",
    initial: DEFAULT_REFINERS_DIR,
  });

  const resolvedDir: string =
    typeof refinersDir === "string" && refinersDir.trim().length > 0
      ? refinersDir.trim()
      : DEFAULT_REFINERS_DIR;

  const config: ZodRefinersConfig = { refinersDir: resolvedDir };
  await writeConfig(cwd, config);
  return config;
}
