import * as fs from "fs";
import * as path from "path";
import { logger } from "../helpers/logger";

/**
 * Per-HU state, checked into the repo — see rules/azure-policy.md's "QA state per HU".
 * One file per work item so each HU's history is an isolated, readable git diff.
 */
export interface QaState {
  workItem: number;
  status: "NOT_ANALYZED" | "ANALYZED" | "AUTOMATED" | "WAITING" | "FAILED";
  risk: "HIGH" | "MEDIUM" | "LOW";
  testCases: number;
  automated: number;
  manual: number;
  lastAnalyzedRevision: number;
  execution: "PASSED" | "FAILED" | "NOT_RUN";
}

const STATE_DIR = path.join(__dirname, "state");

function statePath(workItemId: number): string {
  return path.join(STATE_DIR, `${workItemId}.json`);
}

export function readState(workItemId: number): QaState | undefined {
  const file = statePath(workItemId);
  if (!fs.existsSync(file)) {
    return undefined;
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function writeState(state: QaState): void {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(statePath(state.workItem), JSON.stringify(state, null, 2) + "\n", "utf-8");
  logger.info(`Saved QA state for HU-${state.workItem}: ${state.status} (rev ${state.lastAnalyzedRevision})`);
}

/**
 * True when the HU has never been analyzed, or its Azure DevOps revision has moved
 * on since the last analysis — i.e. an acceptance criterion or description changed.
 * False means: skip re-analysis today, per the daily-cycle rule in azure-policy.md.
 */
export function shouldReanalyze(workItemId: number, currentRevision: number): boolean {
  const state = readState(workItemId);
  if (!state) {
    logger.info(`HU-${workItemId}: no prior state — analysis required`);
    return true;
  }
  const changed = state.lastAnalyzedRevision !== currentRevision;
  logger.info(
    `HU-${workItemId}: last analyzed at rev ${state.lastAnalyzedRevision}, current rev ${currentRevision} — ` +
      (changed ? "re-analysis required" : "unchanged, skipping")
  );
  return changed;
}
