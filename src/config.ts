import path from "node:path";
import fs from "fs-extra";

const CONFIG_FILENAME = "zod-refiners.json";

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
