import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  baseUrl: process.env.BASE_URL ?? "https://the-internet.herokuapp.com",
  headless: (process.env.HEADLESS ?? "true").toLowerCase() !== "false",
  defaultTimeout: Number(process.env.DEFAULT_TIMEOUT ?? 10_000),
  azureDevOps: {
    orgUrl: process.env.AZURE_DEVOPS_ORG_URL,
    project: process.env.AZURE_DEVOPS_PROJECT,
    pat: process.env.AZURE_DEVOPS_PAT,
    repo: process.env.AZURE_DEVOPS_REPO,
    defaultBranch: process.env.AZURE_DEVOPS_DEFAULT_BRANCH ?? "main",
  },
};
