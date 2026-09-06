import * as fs from "fs";

export interface CucumberTag {
  name: string;
  line?: number;
}

export interface CucumberStep {
  keyword: string;
  name?: string;
  hidden?: boolean;
  result: { status: string; duration?: number; error_message?: string };
}

export interface CucumberScenario {
  id: string;
  name: string;
  tags: CucumberTag[];
  steps: CucumberStep[];
}

export interface CucumberFeature {
  name: string;
  uri: string;
  tags: CucumberTag[];
  elements: CucumberScenario[];
}

export function readCucumberReport(jsonPath: string): CucumberFeature[] {
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

export interface ScenarioOutcome {
  passed: boolean;
  failed: boolean;
  skipped: boolean;
  errorMessage?: string;
  durationSeconds: number;
}

/** Single source of truth for "did this scenario pass" — used by the JUnit converter and the Test Plans sync. */
export function getScenarioOutcome(scenario: CucumberScenario): ScenarioOutcome {
  const steps = scenario.steps.filter((s) => !s.hidden);
  const failedStep = steps.find((s) => s.result.status === "failed");
  const notPassedStep = steps.find((s) => s.result.status !== "passed");
  const durationSeconds = scenario.steps.reduce((sum, s) => sum + (s.result.duration ?? 0), 0) / 1e9;
  return {
    passed: !failedStep && !notPassedStep,
    failed: Boolean(failedStep),
    skipped: Boolean(notPassedStep) && !failedStep,
    errorMessage: failedStep?.result.error_message,
    durationSeconds,
  };
}

/** Reads the value of a "@prefixValue" tag, e.g. getTag(scenario, "@testcase:") -> "89951-1". */
export function getTag(scenario: CucumberScenario, prefix: string): string | undefined {
  const tag = scenario.tags?.find((t) => t.name.startsWith(prefix));
  return tag ? tag.name.slice(prefix.length) : undefined;
}

export function hasTag(scenario: CucumberScenario, name: string): boolean {
  return scenario.tags?.some((t) => t.name === name) ?? false;
}
