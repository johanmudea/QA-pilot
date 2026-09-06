import * as fs from "fs";

export interface ParsedStep {
  keyword: string;
  text: string;
}

export interface ParsedScenario {
  name: string;
  tags: string[];
  steps: ParsedStep[];
}

export interface ParsedFeature {
  name: string;
  scenarios: ParsedScenario[];
}

// English and Spanish (`# language: es`) keywords — see rules/gherkin-policy.md.
const STEP_KEYWORDS = ["Given", "When", "Then", "And", "But", "Dado", "Cuando", "Entonces", "Y", "Pero"];
const FEATURE_PREFIXES = ["Feature:", "Característica:"];
const BACKGROUND_PREFIXES = ["Background:", "Antecedentes:"];
const SCENARIO_PREFIXES = ["Scenario:", "Escenario:"];

/**
 * A minimal parser for this repo's Gherkin style (see rules/gherkin-policy.md):
 * one Feature, an optional Background, plain Scenarios (no Outline/Examples — those
 * are split into explicit Scenarios here precisely so each gets its own
 * @testcase:<id>). Good enough for our controlled subset; not a general Gherkin parser.
 */
export function parseFeatureFile(filePath: string): ParsedFeature {
  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);

  let featureName = "";
  let backgroundSteps: ParsedStep[] = [];
  const scenarios: ParsedScenario[] = [];

  let pendingTags: string[] = [];
  let mode: "none" | "background" | "scenario" = "none";
  let currentScenario: ParsedScenario | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    if (line.startsWith("@")) {
      pendingTags.push(...line.split(/\s+/));
      continue;
    }

    const featurePrefix = FEATURE_PREFIXES.find((p) => line.startsWith(p));
    if (featurePrefix) {
      featureName = line.slice(featurePrefix.length).trim();
      pendingTags = [];
      continue;
    }

    if (BACKGROUND_PREFIXES.some((p) => line.startsWith(p))) {
      mode = "background";
      pendingTags = [];
      continue;
    }

    const scenarioPrefix = SCENARIO_PREFIXES.find((p) => line.startsWith(p));
    if (scenarioPrefix) {
      if (currentScenario) scenarios.push(currentScenario);
      currentScenario = { name: line.slice(scenarioPrefix.length).trim(), tags: pendingTags, steps: [] };
      pendingTags = [];
      mode = "scenario";
      continue;
    }

    const stepMatch = STEP_KEYWORDS.find((kw) => line.startsWith(`${kw} `));
    if (stepMatch) {
      const step: ParsedStep = { keyword: stepMatch, text: line.slice(stepMatch.length).trim() };
      if (mode === "background") {
        backgroundSteps.push(step);
      } else if (mode === "scenario" && currentScenario) {
        currentScenario.steps.push(step);
      }
      continue;
    }
    // Free text (feature description lines like "As a ...") is ignored.
  }
  if (currentScenario) scenarios.push(currentScenario);

  for (const scenario of scenarios) {
    scenario.steps = [...backgroundSteps, ...scenario.steps];
  }

  return { name: featureName, scenarios };
}
