import { execFileSync } from "child_process";
import { logger } from "../helpers/logger";

/**
 * Local git plumbing for the agent branch/PR flow — see rules/azure-policy.md
 * ("Builder always works on a branch ... opens a PR ... No agent pushes directly
 * to main"). Deliberately uses the real git CLI (not a REST re-implementation of
 * tree/blob operations) via execFile with argument arrays, never a shell string,
 * so branch names/messages can't be interpreted as shell syntax.
 */
const BRANCH_NAME_PATTERN = /^[a-z0-9][a-z0-9/_-]{2,99}$/;

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf-8" }).trim();
}

export function assertValidBranchName(branch: string): void {
  if (!BRANCH_NAME_PATTERN.test(branch)) {
    throw new Error(`Refusing to use unsafe/invalid branch name: "${branch}"`);
  }
}

export function qaAgentBranchName(workItemId: number, slug: string): string {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const branch = `qa-agent/${workItemId}-${cleanSlug}`;
  assertValidBranchName(branch);
  return branch;
}

export function getCurrentBranch(): string {
  return git(["rev-parse", "--abbrev-ref", "HEAD"]);
}

export function hasUncommittedChanges(): boolean {
  return git(["status", "--porcelain"]).length > 0;
}

/** Creates (or reuses) the branch off baseBranch and checks it out. Never targets main/master. */
export function createQaAgentBranch(branch: string, baseBranch: string): void {
  assertValidBranchName(branch);
  if (branch === "main" || branch === "master") {
    throw new Error("Refusing to create a QA agent branch named main/master.");
  }
  git(["fetch", "origin", baseBranch]);
  const branchExists = git(["branch", "--list", branch]).length > 0;
  if (branchExists) {
    git(["checkout", branch]);
    logger.info(`Reused existing local branch ${branch}`);
    return;
  }
  git(["checkout", "-b", branch, `origin/${baseBranch}`]);
  logger.info(`Created branch ${branch} from origin/${baseBranch}`);
}

export function commitAll(message: string): void {
  git(["add", "-A"]);
  const staged = git(["diff", "--cached", "--name-only"]);
  if (!staged) {
    logger.warn("commitAll called with nothing staged — skipping commit");
    return;
  }
  git(["commit", "-m", message]);
  logger.info(`Committed: ${message}`);
}

export function pushBranch(branch: string): void {
  assertValidBranchName(branch);
  git(["push", "--set-upstream", "origin", branch]);
  logger.info(`Pushed branch ${branch} to origin`);
}
