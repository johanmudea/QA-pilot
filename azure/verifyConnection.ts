import { AzureDevOpsClient } from "./client";
import { logger } from "../helpers/logger";

/**
 * Run with: npm run azure:verify
 * Confirms AZURE_DEVOPS_ORG_URL / AZURE_DEVOPS_PROJECT / AZURE_DEVOPS_PAT (.env)
 * are valid by reading the Test Plans list — no write operations.
 */
async function main(): Promise<void> {
  const client = new AzureDevOpsClient();
  const plans = await client.getTestPlans();
  logger.info(`Connected. Found ${plans.length} test plan(s) in the configured project.`);
  for (const plan of plans) {
    logger.info(`  Plan ${plan.id}: ${plan.name}`);
  }
}

main().catch((error) => {
  logger.error(`Azure DevOps connectivity check failed: ${error.message}`);
  process.exitCode = 1;
});
