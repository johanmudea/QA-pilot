import * as azdev from "azure-devops-node-api";
import { JsonPatchOperation, Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { TestPlan, TestSuite, TestSuiteCreateParams } from "azure-devops-node-api/interfaces/TestPlanInterfaces";
import { RunCreateModel, TestRun, TestCaseResult } from "azure-devops-node-api/interfaces/TestInterfaces";
import { GitPullRequest } from "azure-devops-node-api/interfaces/GitInterfaces";
import { env } from "../config/env";
import { logger } from "../helpers/logger";

/**
 * Deterministic write/read layer for Azure DevOps — see rules/azure-policy.md.
 * Agents decide *what* to write; every call here is a fixed, auditable operation,
 * never a free-form request built by the model at call time.
 */
export class AzureDevOpsClient {
  private connection: azdev.WebApi | undefined;
  private readonly project: string;

  constructor(
    private readonly orgUrl = env.azureDevOps.orgUrl,
    private readonly pat = env.azureDevOps.pat,
    project = env.azureDevOps.project
  ) {
    if (!orgUrl || !pat || !project) {
      throw new Error(
        "Azure DevOps is not configured. Set AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PAT " +
          "and AZURE_DEVOPS_PROJECT in your .env (see .env.example)."
      );
    }
    this.project = project;
  }

  private async getConnection(): Promise<azdev.WebApi> {
    if (!this.connection) {
      const authHandler = azdev.getPersonalAccessTokenHandler(this.pat!);
      this.connection = new azdev.WebApi(this.orgUrl!, authHandler);
    }
    return this.connection;
  }

  // ---- Reads (prefer the Azure DevOps MCP for exploratory reads; these exist for
  // scripts/verification and for confirming a write's result) ----

  async getWorkItem(id: number): Promise<WorkItem> {
    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    return witApi.getWorkItem(id, undefined, undefined, undefined, this.project);
  }

  async getTestPlans(): Promise<TestPlan[]> {
    const connection = await this.getConnection();
    const testPlanApi = await connection.getTestPlanApi();
    const result = await testPlanApi.getTestPlans(this.project);
    return result;
  }

  async getTestSuitesForPlan(planId: number): Promise<TestSuite[]> {
    const connection = await this.getConnection();
    const testPlanApi = await connection.getTestPlanApi();
    return testPlanApi.getTestSuitesForPlan(this.project, planId);
  }

  // ---- Writes ----

  async createTestCase(fields: Record<string, string | number>): Promise<WorkItem> {
    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    const document = this.toPatchDocument(fields);
    const workItem = await witApi.createWorkItem({}, document, this.project, "Test Case");
    logger.info(`Created Test Case ${workItem.id}: ${fields["System.Title"]}`);
    return workItem;
  }

  async createBug(fields: Record<string, string | number>): Promise<WorkItem> {
    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    const document = this.toPatchDocument(fields);
    const workItem = await witApi.createWorkItem({}, document, this.project, "Bug");
    logger.warn(`Created Bug ${workItem.id}: ${fields["System.Title"]}`);
    return workItem;
  }

  async addWorkItemComment(workItemId: number, text: string): Promise<void> {
    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    await witApi.addComment({ text }, this.project, workItemId);
    logger.info(`Commented on work item ${workItemId}`);
  }

  /** Links a source work item to a target, e.g. Test Case -> HU ("Tests" relation). */
  async linkWorkItems(sourceId: number, targetId: number, relationType: string): Promise<void> {
    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    const document: JsonPatchOperation[] = [
      {
        op: Operation.Add,
        path: "/relations/-",
        value: {
          rel: relationType,
          url: `${this.orgUrl}/_apis/wit/workItems/${targetId}`,
        },
      },
    ];
    await witApi.updateWorkItem({}, document, sourceId, this.project);
    logger.info(`Linked work item ${sourceId} -> ${targetId} (${relationType})`);
  }

  async createTestSuite(planId: number, parentSuiteId: number, name: string): Promise<TestSuite> {
    const connection = await this.getConnection();
    const testPlanApi = await connection.getTestPlanApi();
    const params: TestSuiteCreateParams = {
      name,
      // `name` on the reference is ignored by the API when linking an existing suite by id.
      parentSuite: { id: parentSuiteId, name: "" },
    };
    const suite = await testPlanApi.createTestSuite(params, this.project, planId);
    logger.info(`Created Test Suite "${name}" in plan ${planId}`);
    return suite;
  }

  async addTestCaseToSuite(planId: number, suiteId: number, testCaseId: number): Promise<void> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    await testApi.addTestCasesToSuite(this.project, planId, suiteId, String(testCaseId));
    logger.info(`Added Test Case ${testCaseId} to suite ${suiteId} (plan ${planId})`);
  }

  async createTestRun(name: string, planId: number, pointIds: number[]): Promise<TestRun> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    const runCreateModel: RunCreateModel = {
      name,
      plan: { id: String(planId) },
      configurationIds: [],
      pointIds,
      automated: true,
    };
    const run = await testApi.createTestRun(runCreateModel, this.project);
    logger.info(`Created Test Run ${run.id}: ${name}`);
    return run;
  }

  async publishTestResult(
    runId: number,
    testCaseResultId: number,
    passed: boolean,
    comment?: string
  ): Promise<TestCaseResult[]> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    const results: TestCaseResult[] = [
      {
        id: testCaseResultId,
        outcome: passed ? "Passed" : "Failed",
        state: "Completed",
        comment,
      },
    ];
    const updated = await testApi.updateTestResults(results, this.project, runId);
    logger.info(`Published result for run ${runId}, result ${testCaseResultId}: ${passed ? "PASSED" : "FAILED"}`);
    return updated;
  }

  /**
   * Opens a PR from sourceBranch into targetBranch. Mentioning "AB#<id>" in the
   * description auto-links the PR to the work item in Azure DevOps; workItemIds
   * additionally sets the explicit work item refs on the PR itself.
   */
  async createPullRequest(params: {
    repositoryName: string;
    sourceBranch: string;
    targetBranch: string;
    title: string;
    description: string;
    workItemIds?: number[];
  }): Promise<GitPullRequest> {
    const connection = await this.getConnection();
    const gitApi = await connection.getGitApi();
    const repositories = await gitApi.getRepositories(this.project);
    const repository = repositories.find((repo) => repo.name === params.repositoryName);
    if (!repository?.id) {
      throw new Error(
        `Repository "${params.repositoryName}" not found in project "${this.project}".`
      );
    }

    const pullRequest: GitPullRequest = {
      sourceRefName: `refs/heads/${params.sourceBranch}`,
      targetRefName: `refs/heads/${params.targetBranch}`,
      title: params.title,
      description: params.description,
      workItemRefs: params.workItemIds?.map((id) => ({ id: String(id) })),
    };

    const created = await gitApi.createPullRequest(pullRequest, repository.id, this.project);
    logger.info(`Opened PR #${created.pullRequestId}: ${params.title} (${params.sourceBranch} -> ${params.targetBranch})`);
    return created;
  }

  private toPatchDocument(fields: Record<string, string | number>): JsonPatchOperation[] {
    return Object.entries(fields).map(([path, value]) => ({
      op: Operation.Add,
      path: `/fields/${path}`,
      value,
    }));
  }
}
