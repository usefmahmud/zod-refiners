import path from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { ensureConfig, readConfig } from "./config";
import { loadManifest, resolveClosureOrReport, copyEntry } from "./registry";

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

program
  .command("list")
  .description("List all refiners available to add")
  .action(async () => {
    const manifest = await loadManifest();

    console.log(pc.bold("\nAvailable refiners:\n"));

    for (const entry of manifest) {
      if (entry.name === "types") continue;

      console.log(`  ${pc.cyan(entry.name)}`);
      console.log(`    ${entry.description}\n`);
    }
  });

program
  .command("add <refiners...>")
  .description("Add one or more refiners to your project")
  .action(async (refinerNames: string[]) => {
    const cwd = process.cwd();
    const config = await ensureConfig(cwd);
    const manifest = await loadManifest();

    const closure = resolveClosureOrReport(refinerNames, manifest);
    if (!closure || closure.length === 0) return;

    const targetDir = path.join(cwd, config.refinersDir);
    for (const entry of closure) {
      await copyEntry(entry, targetDir);
    }

    console.log(pc.bold(pc.green("\nDone.")));
  });

program.parseAsync(process.argv);