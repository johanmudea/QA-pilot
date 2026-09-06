import { AzureDevOpsClient } from "./client";

/** One-off: dump full AC text for every User Story in a sprint, for QA analysis. */
async function main(): Promise<void> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  const client = new AzureDevOpsClient();
  const items = await client.getSprintWorkItems(args["team"], args["iteration"]);
  const stories = items.filter((i) => i.fields?.["System.WorkItemType"] === "User Story");

  for (const item of stories) {
    const f = item.fields ?? {};
    console.log(`\n===== #${item.id} (${f["System.State"]}) ${f["System.Title"]} =====`);
    console.log("DESCRIPTION:", f["System.Description"] ?? "(empty)");
    console.log("ACCEPTANCE CRITERIA:", f["Microsoft.VSTS.Common.AcceptanceCriteria"] ?? "(empty)");
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
