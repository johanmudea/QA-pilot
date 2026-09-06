import * as fs from "fs";
import * as path from "path";

interface CucumberStep {
  keyword: string;
  name?: string;
  hidden?: boolean;
  result: { status: string; duration?: number; error_message?: string };
}

interface CucumberScenario {
  id: string;
  name: string;
  steps: CucumberStep[];
}

interface CucumberFeature {
  name: string;
  uri: string;
  elements: CucumberScenario[];
}

/**
 * Converts cucumber-js's legacy JSON report (reports/cucumber-report.json) into a
 * minimal JUnit XML that Azure Pipelines' PublishTestResults@2 task understands.
 * cucumber-js has no built-in JUnit formatter (only json/progress/summary/rerun/
 * snippets/usage) — see rules/ci-policy.md.
 */
export function convertCucumberJsonToJunit(jsonPath: string, xmlPath: string): void {
  const features: CucumberFeature[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const suites = features.map((feature) => {
    const cases = feature.elements.map((scenario) => {
      const steps = scenario.steps.filter((s) => !s.hidden);
      const failed = steps.find((s) => s.result.status === "failed");
      const notPassed = steps.find((s) => s.result.status !== "passed");
      const durationSeconds =
        scenario.steps.reduce((sum, s) => sum + (s.result.duration ?? 0), 0) / 1e9;

      let body = "";
      if (failed) {
        const message = escapeXml(failed.result.error_message ?? "Step failed");
        body = `<failure message="${escapeXml(truncate(message, 200))}">${message}</failure>`;
      } else if (notPassed) {
        body = `<skipped message="${escapeXml(notPassed.result.status)}"/>`;
      }

      return {
        name: escapeXml(scenario.name),
        classname: escapeXml(feature.name),
        time: durationSeconds.toFixed(3),
        body,
        failed: Boolean(failed),
        skipped: Boolean(notPassed) && !failed,
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
