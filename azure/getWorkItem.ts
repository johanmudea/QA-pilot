import { AzureDevOpsClient } from "./client";
import { logger } from "../helpers/logger";

/**
 * Run with: npm run azure:hu -- --id 89951
 * Reads one work item's full fields — title, description, acceptance criteria,
 * state — the read described in rules/azure-policy.md's traceability chain, once an
 * id has been picked from `npm run azure:sprint`.
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
  const id = Number(args["id"]);
  if (!id) {
    throw new Error("Usage: --id <work item id>");
  }

  const client = new AzureDevOpsClient();
  const item = await client.getWorkItem(id);
  const fields = item.fields ?? {};

  logger.info(`#${item.id} [${fields["System.WorkItemType"]}] (${fields["System.State"]}) ${fields["System.Title"]}`);
  console.log("\n--- Area/Iteration ---");
  console.log("Area Path:", fields["System.AreaPath"]);
  console.log("Iteration Path:", fields["System.IterationPath"]);
  console.log("Tags:", fields["System.Tags"] ?? "(none)");

  console.log("\n--- Description ---");
  console.log(fields["System.Description"] ?? "(empty)");

  console.log("\n--- Acceptance Criteria ---");
  console.log(fields["Microsoft.VSTS.Common.AcceptanceCriteria"] ?? "(field not set on this work item type)");

  console.log("\n--- All fields (raw) ---");
  console.log(JSON.stringify(fields, null, 2));
}

main().catch((error) => {
  logger.error(`azure:hu failed: ${error.message}`);
  process.exitCode = 1;
});
