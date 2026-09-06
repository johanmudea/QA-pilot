import { AzureDevOpsClient } from "./client";
import { readCucumberReport, getScenarioOutcome, getTag } from "../helpers/cucumberReport";
import { logger } from "../helpers/logger";

/**
 * Run with:
 *   npm run azure:publish-results -- --plan <planId> --suite <suiteId> [--report reports/cucumber-report.json]
 *
 * Syncs Cucumber scenario results back to their linked Azure Test Plans Test Case,
 * via the `@testcase:<id>` tag convention (rules/gherkin-policy.md). One Test Run is
 * created per invocation, covering every tagged scenario found in the report.
 */
const TESTCASE_TAG_PREFIX = "@testcase:";

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
  const suiteId = Number(args["suite"]);
  const reportPath = args["report"] ?? "reports/cucumber-report.json";

  if (!planId || !suiteId) {
    throw new Error("Usage: --plan <planId> --suite <suiteId> [--report <path>]");
  }

  const features = readCucumberReport(reportPath);
  const scenarios = features.flatMap((feature) => feature.elements);

  const tagged = scenarios
    .map((scenario) => ({ scenario, testCaseId: getTag(scenario, TESTCASE_TAG_PREFIX) }))
    .filter((s): s is { scenario: typeof s.scenario; testCaseId: string } => Boolean(s.testCaseId));

  if (tagged.length === 0) {
    logger.info(`No scenario in ${reportPath} carries a "${TESTCASE_TAG_PREFIX}<id>" tag — nothing to publish.`);
    return;
  }

  const client = new AzureDevOpsClient();

  const resolved: { scenarioName: string; testCaseId: number; pointId: number; passed: boolean; comment: string }[] = [];
  for (const { scenario, testCaseId } of tagged) {
    const outcome = getScenarioOutcome(scenario);
    const points = await client.getTestPointsForCase(planId, suiteId, Number(testCaseId));
    if (points.length === 0) {
      logger.warn(
        `Test Case ${testCaseId} (scenario "${scenario.name}") has no point in plan ${planId}/suite ${suiteId} — ` +
          "is it added to that suite? Skipping."
      );
      continue;
    }
    resolved.push({
      scenarioName: scenario.name,
      testCaseId: Number(testCaseId),
      pointId: points[0].id,
      passed: outcome.passed,
      comment: outcome.errorMessage ?? (outcome.passed ? "Passed" : "Failed"),
    });
  }

  if (resolved.length === 0) {
    logger.warn("No tagged scenario resolved to a Test Point — nothing published.");
    return;
  }

  const run = await client.createTestRun(
    `Automated run ${new Date().toISOString()}`,
    planId,
    resolved.map((r) => r.pointId)
  );
  if (!run.id) {
    throw new Error("Test Run was created without an id.");
  }

  const autoResults = await client.getTestResults(run.id);
  const updates = resolved
    .map((r) => {
      const match = autoResults.find((result) => result.testCase?.id === String(r.testCaseId));
      if (!match?.id) {
        logger.warn(`No auto-generated result found for Test Case ${r.testCaseId} in run ${run.id}`);
        return undefined;
      }
      return { resultId: match.id, passed: r.passed, comment: r.comment };
    })
    .filter((u): u is { resultId: number; passed: boolean; comment: string } => Boolean(u));

  await client.publishTestResultsBatch(run.id, updates);
  logger.info(`Synced ${updates.length}/${tagged.length} tagged scenario(s) to Test Run ${run.id}`);
}

main().catch((error) => {
  logger.error(`azure:publish-results failed: ${error.message}`);
  process.exitCode = 1;
});
