import { ParsedStep } from "./gherkinParser";

/**
 * Azure Test Plans stores manual Test Case steps as XML in the
 * "Microsoft.VSTS.TCM.Steps" field — one <step> per Action/Expected Result row.
 * This maps Given/When/And lines to Action rows, and trailing Then/And lines to
 * the Expected Result of the last Action row (see rules/gherkin-policy.md).
 */
export interface TcmStepRow {
  action: string;
  expected: string;
}

const THEN_KEYWORDS = new Set(["Then", "Entonces"]);
const AND_KEYWORDS = new Set(["And", "Y"]);

export function gherkinStepsToTcmRows(steps: ParsedStep[]): TcmStepRow[] {
  const rows: TcmStepRow[] = [];
  const expectedTexts: string[] = [];

  for (const step of steps) {
    const isExpected = THEN_KEYWORDS.has(step.keyword) || (AND_KEYWORDS.has(step.keyword) && expectedTexts.length > 0);
    if (isExpected) {
      expectedTexts.push(step.text);
    } else {
      rows.push({ action: `${step.keyword} ${step.text}`, expected: "" });
    }
  }

  if (expectedTexts.length > 0) {
    const expected = expectedTexts.join(" ");
    if (rows.length > 0) {
      rows[rows.length - 1].expected = expected;
    } else {
      rows.push({ action: "", expected });
    }
  }

  return rows;
}

export function buildTcmStepsXml(rows: TcmStepRow[]): string {
  const stepsXml = rows
    .map(
      (row, index) => `  <step id="${index + 1}" type="ActionStep">
    <parameterizedString isformatted="false">${escapeXml(row.action)}</parameterizedString>
    <parameterizedString isformatted="false">${escapeXml(row.expected)}</parameterizedString>
    <description/>
  </step>`
    )
    .join("\n");
  return `<steps id="0" last="${rows.length}">\n${stepsXml}\n</steps>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
