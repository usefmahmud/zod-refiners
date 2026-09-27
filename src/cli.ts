import { Command } from "commander";
import { ensureConfig, readConfig } from "./config";
import pc from "picocolors";

const program = new Command();

program
  .name("zod-refiners")
  .description(
    "Copy isolated, composable Zod refiner functions into your project.",
  )
  .version("0.1.0");

program
  .command("init")
  .description("Set up zod-refiners.json in the current project")
  .action(async () => {
    const cwd = process.cwd();
    const existing = await readConfig(cwd);

    if (existing) {
      console.log(
        pc.yellow(
          `Already configured. refinersDir = "${existing.refinersDir}"`,
        ),
      );

      return;
    }
    const config = await ensureConfig(cwd);

    console.log(
      pc.green(
        `Created zod-refiners.json (refinersDir = "${config.refinersDir}")`,
      ),
    );
  });
