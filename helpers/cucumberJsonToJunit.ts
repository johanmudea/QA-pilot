import * as fs from "fs";
import * as path from "path";
import { readCucumberReport, getScenarioOutcome } from "./cucumberReport";

/**
 * Converts cucumber-js's legacy JSON report (reports/cucumber-report.json) into a
 * minimal JUnit XML that Azure Pipelines' PublishTestResults@2 task understands.
 * cucumber-js has no built-in JUnit formatter (only json/progress/summary/rerun/
 * snippets/usage) — see rules/ci-policy.md.
 */
export function convertCucumberJsonToJunit(jsonPath: string, xmlPath: string): void {
  const features = readCucumberReport(jsonPath);

  const suites = features.map((feature) => {
    const cases = feature.elements.map((scenario) => {
      const outcome = getScenarioOutcome(scenario);

      let body = "";
      if (outcome.failed) {
        const message = escapeXml(outcome.errorMessage ?? "Step failed");
        body = `<failure message="${escapeXml(truncate(message, 200))}">${message}</failure>`;
      } else if (outcome.skipped) {
        body = `<skipped/>`;
      }

      return {
        name: escapeXml(scenario.name),
        classname: escapeXml(feature.name),
        time: outcome.durationSeconds.toFixed(3),
        body,
        failed: outcome.failed,
        skipped: outcome.skipped,
      };
    });

    const failures = cases.filter((c) => c.failed).length;
    const skipped = cases.filter((c) => c.skipped).length;

    const testcasesXml = cases
      .map(
        (c) =>
          `    <testcase name="${c.name}" classname="${c.classname}" time="${c.time}">${c.body}</testcase>`
      )
      .join("\n");

    return `  <testsuite name="${escapeXml(feature.name)}" tests="${cases.length}" failures="${failures}" skipped="${skipped}">\n${testcasesXml}\n  </testsuite>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n${suites.join("\n")}\n</testsuites>\n`;

  fs.mkdirSync(path.dirname(xmlPath), { recursive: true });
  fs.writeFileSync(xmlPath, xml, "utf-8");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

if (require.main === module) {
  const jsonPath = process.argv[2] ?? "reports/cucumber-report.json";
  const xmlPath = process.argv[3] ?? "reports/junit/cucumber-junit.xml";
  convertCucumberJsonToJunit(jsonPath, xmlPath);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${xmlPath}`);
}
