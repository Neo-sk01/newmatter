/**
 * Langfuse SDK exports
 * 
 * Main entry point for Langfuse observability in the application.
 */

export { getLangfuseClient, flushLangfuse, shutdownLangfuse } from "./client";
export { LANGFUSE_CONFIG, getEnvironmentTag } from "./config";
export {
  ScoreType,
  scoreObservation,
  scoreEmailQuality,
  scoreResearchRelevance,
  scorePersonalization,
  batchScoreEmail,
} from "./scoring";
export {
  createDataset,
  addEmailGenerationExample,
  addLeadResearchExample,
  runExperiment,
} from "./datasets";


