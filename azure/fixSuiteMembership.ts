import * as fs from "fs";
import * as path from "path";
import { AzureDevOpsClient } from "./client";
import { parseFeatureFile } from "../helpers/gherkinParser";
import { logger } from "../helpers/logger";

/**
 * One-off repair: our first sync run linked each Test Case to its HU using
 * "Microsoft.VSTS.Common.TestedBy-Forward" FROM the Test Case TO the HU — the
 * wrong direction. That's why the Requirement-based Suites showed empty ("Add a
 * test case") in the Azure UI even though a relation existed. The correct
 * mechanism is addTestCaseToSuite, which creates the link in the right direction
 * AND registers suite membership/points — this removes the bad link first (Azure
 * refuses to add the correct one otherwise, calling it circular) then adds each
 * Test Case to its suite properly.
 *
 * Run with: npm run azure:fix-suite-membership -- --plan 46412 --parentSuite 91009
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
  const planId = Number(args["plan"]);
  const parentSuiteId = Number(args["parentSuite"]);
  if (!planId || !parentSuiteId) {
    throw new Error("Usage: --plan <planId> --parentSuite <suiteId>");
  }

  const client = new AzureDevOpsClient();
  const allSuites = await client.getTestSuitesForPlan(planId);
  const requirementSuites = allSuites.filter(
    (s) => s.parentSuite?.id === parentSuiteId && s.requirementId
  );

  const featureFiles = fs
    .readdirSync("features")
    .filter((f) => f.endsWith(".feature") && f !== "login.feature");

  let fixedCount = 0;
  let skippedCount = 0;

  for (const file of featureFiles) {
    const feature = parseFeatureFile(path.join("features", file));
    const huMatch = feature.scenarios[0]?.tags.map((t) => t.match(/^@hu:(\d+)$/)).find(Boolean);
    if (!huMatch) continue;
    const huId = Number(huMatch[1]);

    const suite = requirementSuites.find((s) => s.requirementId === huId);
    if (!suite?.id) {
      logger.warn(`No requirement suite found for HU-${huId} (${file}) — skipping`);
      continue;
    }

    for (const scenario of feature.scenarios) {
      const tcMatch = scenario.tags.map((t) => t.match(/^@testcase:(\d+)$/)).find(Boolean);
      if (!tcMatch) continue;
      const testCaseId = Number(tcMatch[1]);

      const removed = await client.removeWorkItemRelation(
        testCaseId,
        huId,
        "Microsoft.VSTS.Common.TestedBy-Forward"
      );
      if (!removed) {
        logger.info(`Test Case ${testCaseId}: no stale relation to remove`);
      }

      try {
        await client.addTestCaseToSuite(planId, suite.id, testCaseId);
        fixedCount += 1;
      } catch (error: any) {
        logger.error(`Test Case ${testCaseId} -> suite ${suite.id} failed: ${error.message}`);
        skippedCount += 1;
      }
    }
  }

  logger.info(`Done. Fixed ${fixedCount} Test Case(s), ${skippedCount} failure(s).`);
}

main().catch((error) => {
  logger.error(`azure:fix-suite-membership failed: ${error.message}`);
  process.exitCode = 1;
});
