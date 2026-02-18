#!/usr/bin/env node

import inquirer from "inquirer";

import { runLiderScrapeAndImport } from "./run-lider-import.js";

type ScriptId = "example-task" | "another-task" | "lider-scrape-import";

const SCRIPT_CHOICES: { name: string; value: ScriptId; description: string }[] = [
  {
    name: "Scrapear Lider.cl e importar productos",
    value: "lider-scrape-import",
    description: "Scrapea listados de www.lider.cl/supermercado y los importa a tu tienda.",
  },
  {
    name: "Example task",
    value: "example-task",
    description: "Runs an example script (placeholder).",
  },
  {
    name: "Another task",
    value: "another-task",
    description: "Runs another example script (placeholder).",
  },
];

async function runScript(scriptId: ScriptId) {
  switch (scriptId) {
    case "lider-scrape-import": {
      const result = await runLiderScrapeAndImport({
        categoryPath: "/supermercado/category/",
        maxPages: 2,
        dryRun: false,
      });
      if (result.errors.length > 0) {
        result.errors.forEach((e) => console.warn("[Lider]", e));
      }
      console.log("[Lider] Listo. Scrapeados:", result.scraped, "Importados:", result.imported, "Fallidos:", result.failed);
      break;
    }
    case "example-task": {
      console.log("[scripts] Running example task...");
      console.log("[scripts] Example task completed.");
      break;
    }
    case "another-task": {
      console.log("[scripts] Running another task...");
      console.log("[scripts] Another task completed.");
      break;
    }
  }
}

export async function main() {
  const answer = await inquirer.prompt<{
    script: ScriptId;
  }>([
    {
      type: "list",
      name: "script",
      message: "Select a script to run:",
      choices: SCRIPT_CHOICES.map((choice) => ({
        name: `${choice.name} — ${choice.description}`,
        value: choice.value,
      })),
    },
  ]);

  await runScript(answer.script);
}

// Run main when executed directly
void main();
