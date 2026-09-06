import { execFileSync } from "child_process";
import { AzureDevOpsClient } from "./client";
import { qaAgentBranchName, createQaAgentBranch, commitAll, pushBranch, hasUncommittedChanges } from "./git";
import { env } from "../config/env";
import { logger } from "../helpers/logger";

/**
 * Run with:
 *   npm run qa:open-pr -- --workItem 12345 --slug login-invalid-password \
 *     --title "Automate: login with invalid credentials" \
 *     --description "Adds Gherkin scenario + Page Object for HU-12345." \
 *     [--base main] [--commit-message "..."]
 *
 * Enforces rules/azure-policy.md's branch policy: never commits to main/master,
 * always opens a PR instead of pushing straight to the default branch, and refuses
 * to push if the local quality gate (typecheck + Cucumber suite) fails.
 */
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

function runQualityGate(): void {
  logger.info("Running quality gate: typecheck");
  execFileSync("npx", ["tsc", "--noEmit"], { stdio: "inherit", shell: true });
  logger.info("Running quality gate: Cucumber suite");
  execFileSync("npx", ["cucumber-js"], { stdio: "inherit", shell: true });
  logger.info("Quality gate passed");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const workItemId = Number(args["workItem"]);
  const slug = args["slug"];
  const title = args["title"];
  const description = args["description"] ?? "";
  const baseBranch = args["base"] ?? env.azureDevOps.defaultBranch;
  const commitMessage = args["commit-message"] ?? title;

  if (!workItemId || !slug || !title) {
    throw new Error("Usage: --workItem <id> --slug <slug> --title <title> [--description <text>] [--base <branch>]");
  }
  if (!env.azureDevOps.repo) {
    throw new Error("Set AZURE_DEVOPS_REPO in your .env (see .env.example) before opening a PR.");
  }

  const branch = qaAgentBranchName(workItemId, slug);

  runQualityGate();

  if (!hasUncommittedChanges()) {
    throw new Error("Nothing to commit — quality gate passed but the working tree is clean.");
  }

  createQaAgentBranch(branch, baseBranch);
  commitAll(commitMessage);
  pushBranch(branch);

  const client = new AzureDevOpsClient();
  const pr = await client.createPullRequest({
    repositoryName: env.azureDevOps.repo,
    sourceBranch: branch,
    targetBranch: baseBranch,
    title,
    description: `${description}\n\nAB#${workItemId}`,
    workItemIds: [workItemId],
  });

  logger.info(`PR ready for review: ${pr.pullRequestId}`);
}

main().catch((error) => {
  logger.error(`qa:open-pr failed: ${error.message}`);
  process.exitCode = 1;
});
