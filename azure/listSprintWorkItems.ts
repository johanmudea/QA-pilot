import { AzureDevOpsClient } from "./client";
import { logger } from "../helpers/logger";

/**
 * Run with:
 *   npm run azure:sprint -- --team "Team - Evaluacion proveedores" \
 *     --iteration "Summa - Summa Network\Evaluacion proveedores\Sprint 2"
 *
 * "Discover" step of the daily cycle (rules/azure-policy.md) — lists every work
 * item in a sprint so the Explorer knows what's new/changed.
 */
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const team = args["team"];
  const iteration = args["iteration"];
  if (!team || !iteration) {
    throw new Error('Usage: --team "<team name>" --iteration "<iteration path>"');
  }

  const client = new AzureDevOpsClient();
  const workItems = await client.getSprintWorkItems(team, iteration);

  logger.info(`Found ${workItems.length} work item(s) in "${iteration}"`);
  for (const item of workItems) {
    const type = item.fields?.["System.WorkItemType"];
    const title = item.fields?.["System.Title"];
    const state = item.fields?.["System.State"];
    logger.info(`  #${item.id} [${type}] (${state}) ${title}`);
  }
}

main().catch((error) => {
  logger.error(`azure:sprint failed: ${error.message}`);
  process.exitCode = 1;
});
