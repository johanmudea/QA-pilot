import * as fs from "fs";
import * as path from "path";
import { AzureDevOpsClient } from "./client";
import { logger } from "../helpers/logger";

/**
 * Records a MANUAL test execution against real Test Points, evidence included —
 * the counterpart to azure/publishTestResults.ts (which is for @testcase:<id>
 * scenarios executed by Cucumber). A manual outcome is never inferred: it comes
 * from a human (or an agent acting as one) actually exercising the app and
 * observing the result, which is why each entry requires its own comment and,
 * ideally, a screenshot.
 *
 * Run with:
 *   npm run azure:record-manual-run -- --data <path-to-results.json>
 *
 * results.json shape:
 * {
 *   "plan": 46412,
 *   "suite": 91533,
 *   "runName": "Manual execution HU-90129 - 2026-09-07",
 *   "results": [
 *     { "testCaseId": 91532, "outcome": "Passed", "comment": "...", "screenshot": "C:\\...\\evidence.png" }
 *   ]
 * }
 * outcome is one of "Passed" | "Failed" | "Blocked" | "NotApplicable". `screenshot`
 * is optional — omit it for a result with no visual evidence to attach.
 */
interface ManualResultInput {
  testCaseId: number;
  outcome: "Passed" | "Failed" | "Blocked" | "NotApplicable";
  comment: string;
  screenshot?: string;
}

interface ManualRunData {
  plan: number;
  suite: number;
  runName: string;
  results: ManualResultInput[];
}

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
  const dataPath = args["data"];
  if (!dataPath) {
    throw new Error("Usage: --data <path-to-results.json>");
  }

  const data: ManualRunData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const client = new AzureDevOpsClient();

  const resolved: { testCaseId: number; pointId: number; outcome: ManualResultInput["outcome"]; comment: string; screenshot?: string }[] = [];
  for (const result of data.results) {
    const points = await client.getTestPointsForCase(data.plan, data.suite, result.testCaseId);
    if (points.length === 0) {
      logger.warn(`Test Case ${result.testCaseId} has no point in plan ${data.plan}/suite ${data.suite} — skipping.`);
      continue;
    }
    resolved.push({ testCaseId: result.testCaseId, pointId: points[0].id, outcome: result.outcome, comment: result.comment, screenshot: result.screenshot });
  }

  if (resolved.length === 0) {
    logger.warn("No Test Case resolved to a Test Point — nothing recorded.");
    return;
  }

  const run = await client.createTestRun(data.runName, data.plan, resolved.map((r) => r.pointId), false);
  if (!run.id) {
    throw new Error("Test Run was created without an id.");
  }

  const autoResults = await client.getTestResults(run.id);
  const matched = resolved
    .map((r) => {
      const match = autoResults.find((result) => result.testCase?.id === String(r.testCaseId));
      if (!match?.id) {
        logger.warn(`No auto-generated result found for Test Case ${r.testCaseId} in run ${run.id}`);
        return undefined;
      }
      return { ...r, resultId: match.id };
    })
    .filter((r): r is typeof resolved[number] & { resultId: number } => Boolean(r));

  await client.publishManualResultsBatch(
    run.id,
    matched.map((r) => ({ resultId: r.resultId, outcome: r.outcome, comment: r.comment }))
  );

  for (const r of matched) {
    if (!r.screenshot) continue;
    if (!fs.existsSync(r.screenshot)) {
      logger.warn(`Screenshot not found for Test Case ${r.testCaseId}: ${r.screenshot}`);
      continue;
    }
    const base64 = fs.readFileSync(r.screenshot).toString("base64");
    await client.addTestResultAttachment(run.id, r.resultId, path.basename(r.screenshot), base64, r.comment);
  }

  logger.info(`Recorded ${matched.length} manual result(s) in run ${run.id} (plan ${data.plan}, suite ${data.suite})`);
  for (const r of matched) {
    logger.info(`  TC${r.testCaseId}: ${r.outcome}${r.screenshot ? " (with evidence)" : ""}`);
  }
}

main().catch((error) => {
  logger.error(`azure:record-manual-run failed: ${error.message}`);
  process.exitCode = 1;
});
