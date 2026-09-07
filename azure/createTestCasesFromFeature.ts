import * as fs from "fs";
import { AzureDevOpsClient } from "./client";
import { parseFeatureFile, ParsedScenario } from "../helpers/gherkinParser";
import { gherkinStepsToTcmRows, buildTcmStepsXml } from "../helpers/tcmSteps";
import { logger } from "../helpers/logger";

/**
 * Run with:
 *   npm run azure:sync-testcases -- --feature features/pqrs-creation-step1.feature \
 *     --plan 46412 --parentSuite 91009
 *
 * For every Scenario in the feature file:
 *   - If it already carries "@testcase:<id>", UPDATES that Test Case's title/steps/
 *     tags in place (e.g. after re-translating the Gherkin) — no suite/link work.
 *   - Otherwise CREATES a new Test Case (title + Microsoft.VSTS.TCM.Steps from the
 *     Gherkin steps, System.Tags from @regression/@critical/@smoke plus "AC-<n>"
 *     per number in an @ac:<n>[,<n>...] or @ac:<n>-<m> tag), links it to the
 *     HU from the scenario's @hu:<id> tag ("Tests" relation), and adds it to a
 *     Requirement-based Suite for that HU (created once under --parentSuite —
 *     rules/gherkin-policy.md, rules/azure-policy.md), then tags the scenario with
 *     "@testcase:<id>" in the feature file.
 */
const CLASSIFICATION_TAGS = ["regression", "critical", "smoke"];

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

function addTestCaseTag(content: string, scenarioName: string, testCaseId: number): string {
  const escapedName = scenarioName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(@[^\\n]*\\n)(\\s*(?:Scenario|Escenario): ${escapedName}\\s*\\n)`);
  return content.replace(pattern, (match, tagLine: string, scenarioLine: string) => {
    if (tagLine.includes(`@testcase:${testCaseId}`)) return match;
    return `${tagLine.trimEnd()} @testcase:${testCaseId}\n${scenarioLine}`;
  });
}

function classificationTags(scenario: ParsedScenario): string[] {
  return scenario.tags
    .map((t) => t.match(/^@(\w+)$/))
    .filter((m): m is RegExpMatchArray => Boolean(m) && CLASSIFICATION_TAGS.includes(m![1]))
    .map((m) => m[1]);
}

/** "@ac:5,6" or "@ac:5-10" -> ["AC-5", "AC-6"] / ["AC-5", ..., "AC-10"], for System.Tags visibility in Azure. */
function acceptanceCriteriaTags(scenario: ParsedScenario): string[] {
  const match = scenario.tags.map((t) => t.match(/^@ac:([\d,-]+)$/)).find(Boolean);
  if (!match) return [];
  const numbers = new Set<number>();
  for (const part of match[1].split(",")) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      for (let n = Number(range[1]); n <= Number(range[2]); n += 1) numbers.add(n);
    } else {
      numbers.add(Number(part));
    }
  }
  return [...numbers].sort((a, b) => a - b).map((n) => `AC-${n}`);
}

function existingTestCaseId(scenario: ParsedScenario): number | undefined {
  const match = scenario.tags.map((t) => t.match(/^@testcase:(\d+)$/)).find(Boolean);
  return match ? Number(match[1]) : undefined;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const featurePath = args["feature"];
  const planId = Number(args["plan"]);
  const parentSuiteId = Number(args["parentSuite"]);
  const existingSuiteId = args["suiteId"] ? Number(args["suiteId"]) : undefined;
  const skip = Number(args["skip"] ?? "0");

  if (!featurePath || !planId || !parentSuiteId) {
    throw new Error("Usage: --feature <path> --plan <planId> --parentSuite <suiteId> [--suiteId <id>] [--skip <n>]");
  }

  const feature = parseFeatureFile(featurePath);
  if (feature.scenarios.length === 0) {
    throw new Error(`No scenarios found in ${featurePath}`);
  }

  const huTag = feature.scenarios[0].tags.map((t) => t.match(/^@hu:(\d+)$/)).find(Boolean);
  if (!huTag) {
    throw new Error(`No "@hu:<id>" tag found on the first scenario of ${featurePath}`);
  }
  const huId = Number(huTag[1]);

  const client = new AzureDevOpsClient();
  let suiteId = existingSuiteId;

  async function ensureSuite(): Promise<number> {
    if (suiteId) return suiteId;
    const hu = await client.getWorkItem(huId);
    const huTitle = hu.fields?.["System.Title"] ?? `HU-${huId}`;
    const suite = await client.createRequirementBasedSuite(planId, parentSuiteId, huId, `HU-${huId}: ${huTitle}`);
    if (!suite.id) {
      throw new Error("Requirement-based Suite was created without an id.");
    }
    suiteId = suite.id;
    return suiteId;
  }

  const created: { scenarioName: string; testCaseId: number }[] = [];
  const updated: { scenarioName: string; testCaseId: number }[] = [];
  const scenariosToProcess = feature.scenarios.slice(skip);
  if (skip > 0) {
    logger.info(`Skipping first ${skip} scenario(s) (--skip)`);
  }

  for (const scenario of scenariosToProcess) {
    const rows = gherkinStepsToTcmRows(scenario.steps);
    const stepsXml = buildTcmStepsXml(rows);
    const tags = [...classificationTags(scenario), ...acceptanceCriteriaTags(scenario)];
    const fields = {
      "System.Title": scenario.name,
      "Microsoft.VSTS.TCM.Steps": stepsXml,
      ...(tags.length > 0 ? { "System.Tags": tags.join("; ") } : {}),
    };

    const existingId = existingTestCaseId(scenario);
    if (existingId) {
      await client.updateTestCase(existingId, fields);
      updated.push({ scenarioName: scenario.name, testCaseId: existingId });
      continue;
    }

    const testCase = await client.createTestCase(fields);
    if (!testCase.id) {
      throw new Error(`Test Case for scenario "${scenario.name}" was created without an id.`);
    }

    const suiteIdForCase = await ensureSuite();
    // addTestCaseToSuite both links the Test Case to the HU (correct direction)
    // and registers it as a suite member with a Test Point. Do NOT also call
    // linkWorkItems — the reverse-direction "TestedBy-Forward" link it would add
    // conflicts with this one ("TF201035: ... circular relationship") and, even
    // when it succeeds, leaves the suite empty in the Azure UI.
    await client.addTestCaseToSuite(planId, suiteIdForCase, testCase.id);

    created.push({ scenarioName: scenario.name, testCaseId: testCase.id });
  }

  let content = fs.readFileSync(featurePath, "utf-8");
  for (const { scenarioName, testCaseId } of created) {
    content = addTestCaseTag(content, scenarioName, testCaseId);
  }
  fs.writeFileSync(featurePath, content, "utf-8");

  logger.info(`HU-${huId}: ${created.length} Test Case(s) created, ${updated.length} updated`);
  for (const { scenarioName, testCaseId } of created) {
    logger.info(`  Created Test Case ${testCaseId}: ${scenarioName}`);
  }
  for (const { scenarioName, testCaseId } of updated) {
    logger.info(`  Updated Test Case ${testCaseId}: ${scenarioName}`);
  }
}

main().catch((error) => {
  logger.error(`azure:sync-testcases failed: ${error.message}`);
  process.exitCode = 1;
});
