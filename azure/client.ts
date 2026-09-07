import * as azdev from "azure-devops-node-api";
import { JsonPatchOperation, Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { WorkItem, WorkItemExpand } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { TestPlan, TestSuite, TestSuiteCreateParams, TestSuiteType } from "azure-devops-node-api/interfaces/TestPlanInterfaces";
import { RunCreateModel, TestRun, TestCaseResult, TestPoint } from "azure-devops-node-api/interfaces/TestInterfaces";
import { GitPullRequest } from "azure-devops-node-api/interfaces/GitInterfaces";
import { TeamContext } from "azure-devops-node-api/interfaces/CoreInterfaces";
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

  async getWorkItemRelations(id: number): Promise<{ rel?: string; url?: string }[]> {
    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    const item = await witApi.getWorkItem(id, undefined, undefined, WorkItemExpand.Relations, this.project);
    return item.relations ?? [];
  }

  /** Removes a relation from a work item by matching rel type + target url (relations are indexed per-item). */
  async removeWorkItemRelation(id: number, targetId: number, relType: string): Promise<boolean> {
    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    const relations = await this.getWorkItemRelations(id);
    const index = relations.findIndex(
      (r) => r.rel === relType && r.url?.endsWith(`/${targetId}`)
    );
    if (index === -1) {
      return false;
    }
    const document: JsonPatchOperation[] = [{ op: Operation.Remove, path: `/relations/${index}` }];
    await witApi.updateWorkItem({}, document, id, this.project);
    logger.info(`Removed relation ${relType} from work item ${id} -> ${targetId}`);
    return true;
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

  /**
   * Lists the work items (HUs, tasks, bugs...) in a sprint — the "Discover" step of
   * the daily cycle (rules/azure-policy.md). `iterationPath` matches a team
   * iteration's `path`, e.g. "Summa - Summa Network\Evaluacion proveedores\Sprint 2"
   * (as it appears in a sprint board URL).
   */
  async getSprintWorkItems(teamName: string, iterationPath: string): Promise<WorkItem[]> {
    const connection = await this.getConnection();
    const workApi = await connection.getWorkApi();
    const teamContext: TeamContext = { project: this.project, team: teamName };

    const iterations = await workApi.getTeamIterations(teamContext);
    const iteration = iterations.find(
      (it) => it.path?.toLowerCase() === iterationPath.toLowerCase()
    );
    if (!iteration?.id) {
      const available = iterations.map((it) => it.path).join(", ");
      throw new Error(
        `Iteration "${iterationPath}" not found for team "${teamName}". Available: ${available}`
      );
    }

    const iterationWorkItems = await workApi.getIterationWorkItems(teamContext, iteration.id);
    const ids = (iterationWorkItems.workItemRelations ?? [])
      .map((relation) => relation.target?.id)
      .filter((id): id is number => typeof id === "number");

    if (ids.length === 0) {
      return [];
    }

    const witApi = await connection.getWorkItemTrackingApi();
    return witApi.getWorkItems(ids, undefined, undefined, undefined, undefined, this.project);
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

  /** Updates an existing Test Case's fields (e.g. re-translating title/steps) without touching its links/suite membership. */
  async updateTestCase(id: number, fields: Record<string, string | number>): Promise<WorkItem> {
    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    const document = this.toPatchDocument(fields);
    const workItem = await witApi.updateWorkItem({}, document, id, this.project);
    logger.info(`Updated Test Case ${id}: ${fields["System.Title"]}`);
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

  /**
   * Uploads a file as a real Work Item attachment and links it via the
   * "AttachedFile" relation, so it shows up in the work item's Attachments tab.
   * Not wrapped by azure-devops-node-api's WorkItemTrackingApi (no
   * createAttachment there) — Azure DevOps's REST API is called directly with the
   * same PAT. Embedding a screenshot as a base64 data: URI inside a rich-text
   * field (e.g. Microsoft.VSTS.TCM.ReproSteps) does NOT work: Azure DevOps
   * sanitizes data: URIs out of HTML fields on save, silently dropping the image —
   * verified by reading the field back after such a save and finding no image.
   */
  async attachFileToWorkItem(workItemId: number, fileName: string, base64Content: string, comment?: string): Promise<void> {
    const auth = Buffer.from(`:${this.pat}`).toString("base64");
    const uploadUrl = `${this.orgUrl}/${encodeURIComponent(this.project)}/_apis/wit/attachments?fileName=${encodeURIComponent(fileName)}&api-version=7.1`;
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/octet-stream" },
      body: Buffer.from(base64Content, "base64"),
    });
    if (!uploadResponse.ok) {
      throw new Error(`Attachment upload failed (${uploadResponse.status}): ${await uploadResponse.text()}`);
    }
    const attachment = (await uploadResponse.json()) as { id: string; url: string };

    const connection = await this.getConnection();
    const witApi = await connection.getWorkItemTrackingApi();
    const document: JsonPatchOperation[] = [
      {
        op: Operation.Add,
        path: "/relations/-",
        value: {
          rel: "AttachedFile",
          url: attachment.url,
          attributes: comment ? { comment } : undefined,
        },
      },
    ];
    await witApi.updateWorkItem({}, document, workItemId, this.project);
    logger.info(`Attached "${fileName}" to work item ${workItemId}`);
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

  /**
   * A Requirement-based Suite — tied to one work item (HU). Per the user's
   * convention: one such suite per HU, nested under a parent "home" suite.
   */
  async createRequirementBasedSuite(
    planId: number,
    parentSuiteId: number,
    workItemId: number,
    name: string
  ): Promise<TestSuite> {
    const connection = await this.getConnection();
    const testPlanApi = await connection.getTestPlanApi();
    const params: TestSuiteCreateParams = {
      name,
      parentSuite: { id: parentSuiteId, name: "" },
      suiteType: TestSuiteType.RequirementTestSuite,
      requirementId: workItemId,
    };
    const suite = await testPlanApi.createTestSuite(params, this.project, planId);
    logger.info(`Created Requirement-based Suite ${suite.id} "${name}" for HU-${workItemId} in plan ${planId}`);
    return suite;
  }

  async addTestCaseToSuite(planId: number, suiteId: number, testCaseId: number): Promise<void> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    await testApi.addTestCasesToSuite(this.project, planId, suiteId, String(testCaseId));
    logger.info(`Added Test Case ${testCaseId} to suite ${suiteId} (plan ${planId})`);
  }

  async createTestRun(name: string, planId: number, pointIds: number[], automated = true): Promise<TestRun> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    const runCreateModel: RunCreateModel = {
      name,
      plan: { id: String(planId) },
      configurationIds: [],
      pointIds,
      automated,
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

  /** Publishes several outcomes in one run — used by the `@testcase:<id>` sync (see rules/gherkin-policy.md). */
  async publishTestResultsBatch(
    runId: number,
    updates: { resultId: number; passed: boolean; comment?: string }[]
  ): Promise<TestCaseResult[]> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    const results: TestCaseResult[] = updates.map((u) => ({
      id: u.resultId,
      outcome: u.passed ? "Passed" : "Failed",
      state: "Completed",
      comment: u.comment,
    }));
    const updated = await testApi.updateTestResults(results, this.project, runId);
    logger.info(`Published ${updates.length} result(s) to run ${runId}`);
    return updated;
  }

  /**
   * Records a manual tester's outcome for a Test Point (Passed/Failed/Blocked/...,
   * see TestOutcome) — unlike publishTestResultsBatch (binary passed/failed, driven
   * by an automated Cucumber run), a manual outcome can be any of Azure's states and
   * always carries the tester's own comment as evidence of what was observed.
   */
  async publishManualResultsBatch(
    runId: number,
    updates: { resultId: number; outcome: "Passed" | "Failed" | "Blocked" | "NotApplicable"; comment: string }[]
  ): Promise<TestCaseResult[]> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    const results: TestCaseResult[] = updates.map((u) => ({
      id: u.resultId,
      outcome: u.outcome,
      state: "Completed",
      comment: u.comment,
    }));
    const updated = await testApi.updateTestResults(results, this.project, runId);
    logger.info(`Published ${updates.length} manual result(s) to run ${runId}`);
    return updated;
  }

  /** Attaches evidence (e.g. a screenshot, base64-encoded) to a manual Test Result. */
  async addTestResultAttachment(
    runId: number,
    testCaseResultId: number,
    fileName: string,
    base64Stream: string,
    comment?: string
  ): Promise<void> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    await testApi.createTestResultAttachment({ fileName, stream: base64Stream, comment }, this.project, runId, testCaseResultId);
    logger.info(`Attached "${fileName}" to result ${testCaseResultId} in run ${runId}`);
  }

  /**
   * Records a manual outcome PER STEP of the Test Case (Microsoft.VSTS.TCM.Steps),
   * not just one outcome for the whole result — `iterationDetails` is Azure's
   * mechanism for this ("Test result details of test iterations used only for
   * Manual Testing"). `stepId` is the step's numeric id as it appears in the Test
   * Case's <step id="N"> XML (see helpers/tcmSteps.ts) — get it right or the step's
   * outcome won't show up against the correct row in the Azure Test Plans UI.
   */
  async publishManualStepResults(
    runId: number,
    resultId: number,
    overallOutcome: "Passed" | "Failed" | "Blocked" | "NotApplicable",
    steps: { stepId: number; outcome: "Passed" | "Failed" | "Blocked" | "NotApplicable"; comment?: string }[],
    comment: string
  ): Promise<TestCaseResult[]> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    const results: TestCaseResult[] = [
      {
        id: resultId,
        outcome: overallOutcome,
        state: "Completed",
        comment,
        iterationDetails: [
          {
            id: 1,
            outcome: overallOutcome,
            actionResults: steps.map((s) => ({
              actionPath: String(s.stepId),
              stepIdentifier: String(s.stepId),
              iterationId: 1,
              outcome: s.outcome,
              errorMessage: s.outcome === "Failed" ? s.comment : undefined,
            })),
          },
        ],
      },
    ];
    const updated = await testApi.updateTestResults(results, this.project, runId);
    logger.info(`Published ${steps.length} step result(s) for result ${resultId} in run ${runId}`);
    return updated;
  }

  /** Attaches evidence to one specific STEP of a Test Result's first iteration (see publishManualStepResults). */
  async addTestIterationResultAttachment(
    runId: number,
    testCaseResultId: number,
    stepId: number,
    fileName: string,
    base64Stream: string,
    comment?: string
  ): Promise<void> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    await testApi.createTestIterationResultAttachment(
      { fileName, stream: base64Stream, comment },
      this.project,
      runId,
      testCaseResultId,
      1,
      String(stepId)
    );
    logger.info(`Attached "${fileName}" to step ${stepId} of result ${testCaseResultId} in run ${runId}`);
  }

  /** The Test Point(s) a Test Case has within a Suite — needed before a run can record a result for it. */
  async getTestPointsForCase(planId: number, suiteId: number, testCaseId: number): Promise<TestPoint[]> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    return testApi.getPoints(this.project, planId, suiteId, undefined, undefined, String(testCaseId));
  }

  /** Results Azure auto-creates (one per point) when a Test Run is created — read to discover their ids. */
  async getTestResults(runId: number): Promise<TestCaseResult[]> {
    const connection = await this.getConnection();
    const testApi = await connection.getTestApi();
    return testApi.getTestResults(this.project, runId);
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
