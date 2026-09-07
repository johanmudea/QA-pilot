import * as fs from "fs";
import * as path from "path";
import { AzureDevOpsClient } from "./client";
import { logger } from "../helpers/logger";

/**
 * Step-by-step counterpart to azure/recordManualRun.ts. Instead of one outcome +
 * one attachment per Test Case, this records an outcome for EACH step of the Test
 * Case (Microsoft.VSTS.TCM.Steps — see AzureDevOpsClient.publishManualStepResults),
 * attaches evidence to the specific step it belongs to, and — for any step marked
 * "Failed" — opens a Bug work item with a step-by-step repro (the failing step's
 * screenshot embedded inline) linked back to both the Test Case and the HU.
 *
 * Run with:
 *   npm run azure:record-manual-run-steps -- --data <path-to-results.json> --hu <workItemId>
 *
 * results.json shape:
 * {
 *   "plan": 46412, "suite": 91533, "runName": "...",
 *   "results": [
 *     {
 *       "testCaseId": 91537,
 *       "overallOutcome": "Failed",
 *       "overallComment": "...",
 *       "steps": [
 *         { "outcome": "Passed", "comment": "..." },
 *         { "outcome": "Failed", "comment": "...", "screenshot": "C:\\...\\evidence.png" }
 *       ]
 *     }
 *   ]
 * }
 * Step order in the array must match the Test Case's actual step order (1-based
 * stepId = array index + 1) — verify with a throwaway dump of
 * gherkinStepsToTcmRows(scenario.steps) against the source .feature before writing
 * this file; a mismatch records the right outcome against the wrong row.
 */
interface StepInput {
  outcome: "Passed" | "Failed" | "Blocked" | "NotApplicable";
  comment: string;
  screenshot?: string;
}

interface ManualResultInput {
  testCaseId: number;
  overallOutcome: "Passed" | "Failed" | "Blocked" | "NotApplicable";
  overallComment: string;
  steps: StepInput[];
  /**
   * Id of an already-open Bug for this same defect (e.g. from a prior run of this
   * script). When set and overallOutcome is "Failed", this re-verification adds a
   * comment + fresh evidence to that Bug instead of opening a new one — omitting
   * this on a re-run is what created duplicate Bugs 91571-91575 for the same 5
   * defects as 91561-91565 (see rules/azure-policy.md).
   */
  existingBugId?: number;
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

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Azure DevOps strips data:-URI <img> tags from rich-text fields on save (verified
// by reading Bug 91561's ReproSteps back after an initial attempt — the image was
// silently dropped), so evidence goes on the Bug as a real attachment
// (AzureDevOpsClient.attachFileToWorkItem) instead of embedded HTML — this only
// builds the step-by-step text.
function buildReproStepsHtml(testCaseId: number, steps: StepInput[], overallComment: string): string {
  const rows = steps
    .map((step) => {
      const badge = step.outcome === "Failed" ? "<b style='color:#c00'>FALLÓ</b>" : `<b>${step.outcome}</b>`;
      const evidenceNote = step.screenshot ? " (ver captura adjunta a este Bug)" : "";
      return `<li>${badge} — ${escapeHtml(step.comment)}${evidenceNote}</li>`;
    })
    .join("\n");
  return `<p>Encontrado ejecutando manualmente el Test Case ${testCaseId} (ver detalle y evidencia paso a paso en ese Test Case).</p>
<p><b>Resumen:</b> ${escapeHtml(overallComment)}</p>
<ol>${rows}</ol>`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dataPath = args["data"];
  const huId = args["hu"] ? Number(args["hu"]) : undefined;
  if (!dataPath) {
    throw new Error("Usage: --data <path-to-results.json> [--hu <workItemId>]");
  }

  const data: ManualRunData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const client = new AzureDevOpsClient();

  const resolved: { testCaseId: number; pointId: number; input: ManualResultInput }[] = [];
  for (const result of data.results) {
    const points = await client.getTestPointsForCase(data.plan, data.suite, result.testCaseId);
    if (points.length === 0) {
      logger.warn(`Test Case ${result.testCaseId} has no point in plan ${data.plan}/suite ${data.suite} — skipping.`);
      continue;
    }
    resolved.push({ testCaseId: result.testCaseId, pointId: points[0].id, input: result });
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

  for (const { testCaseId, input } of resolved) {
    const match = autoResults.find((r) => r.testCase?.id === String(testCaseId));
    if (!match?.id) {
      logger.warn(`No auto-generated result found for Test Case ${testCaseId} in run ${run.id}`);
      continue;
    }

    await client.publishManualStepResults(
      run.id,
      match.id,
      input.overallOutcome,
      input.steps.map((s, i) => ({ stepId: i + 1, outcome: s.outcome, comment: s.comment })),
      input.overallComment
    );

    for (let i = 0; i < input.steps.length; i += 1) {
      const step = input.steps[i];
      if (!step.screenshot) continue;
      if (!fs.existsSync(step.screenshot)) {
        logger.warn(`Screenshot not found for TC${testCaseId} step ${i + 1}: ${step.screenshot}`);
        continue;
      }
      const base64 = fs.readFileSync(step.screenshot).toString("base64");
      await client.addTestIterationResultAttachment(run.id, match.id, i + 1, path.basename(step.screenshot), base64, step.comment);
    }

    logger.info(`TC${testCaseId}: ${input.overallOutcome} (${input.steps.length} step(s) recorded)`);

    if (input.overallOutcome === "Failed") {
      const failingStep = input.steps.find((s) => s.outcome === "Failed") ?? input.steps[input.steps.length - 1];

      if (input.existingBugId) {
        await client.addWorkItemComment(input.existingBugId, `Re-verificado: ${input.overallComment}`);
        if (failingStep?.screenshot && fs.existsSync(failingStep.screenshot)) {
          const base64 = fs.readFileSync(failingStep.screenshot).toString("base64");
          await client.attachFileToWorkItem(input.existingBugId, path.basename(failingStep.screenshot), base64, `Re-verificacion: ${failingStep.comment}`);
        }
        logger.warn(`Bug ${input.existingBugId}: added re-verification comment + evidence for Test Case ${testCaseId} (no new Bug created)`);
      } else {
        const bug = await client.createBug({
          "System.Title": `[HU-90129] Test Case ${testCaseId}: ${input.overallComment.slice(0, 110)}`,
          "Microsoft.VSTS.TCM.ReproSteps": buildReproStepsHtml(testCaseId, input.steps, input.overallComment),
          "System.Tags": "manual-testing; HU-90129",
        });
        if (bug.id) {
          await client.linkWorkItems(bug.id, testCaseId, "System.LinkTypes.Related");
          if (huId) {
            await client.linkWorkItems(bug.id, huId, "System.LinkTypes.Related");
          }
          if (failingStep?.screenshot && fs.existsSync(failingStep.screenshot)) {
            const base64 = fs.readFileSync(failingStep.screenshot).toString("base64");
            await client.attachFileToWorkItem(bug.id, path.basename(failingStep.screenshot), base64, failingStep.comment);
          }
          logger.warn(`Bug ${bug.id} created and linked to Test Case ${testCaseId}${huId ? ` and HU-${huId}` : ""}`);
        }
      }
    }
  }

  logger.info(`Done. Run ${run.id} (plan ${data.plan}, suite ${data.suite}).`);
}

main().catch((error) => {
  logger.error(`azure:record-manual-run-steps failed: ${error.message}`);
  process.exitCode = 1;
});
