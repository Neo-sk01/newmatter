import { getLangfuseClient } from "./client";

/**
 * Create a dataset for testing and evaluation
 */
export async function createDataset(name: string, description?: string) {
  const langfuse = getLangfuseClient();
  return langfuse.createDataset({
    name,
    description,
  });
}

/**
 * Add an email generation example to a dataset
 */
export async function addEmailGenerationExample(params: {
  datasetName: string;
  input: {
    lead: {
      firstName?: string;
      lastName?: string;
      company?: string;
      title?: string;
      email?: string;
    };
    prompt: string;
    system?: string;
    researchSummary?: string;
  };
  expectedOutput?: {
    subject?: string;
    body?: string;
  };
  metadata?: Record<string, any>;
}) {
  const langfuse = getLangfuseClient();
  
  return langfuse.createDatasetItem({
    datasetName: params.datasetName,
    input: params.input,
    expectedOutput: params.expectedOutput,
    metadata: params.metadata,
  });
}

/**
 * Add a lead research example to a dataset
 */
export async function addLeadResearchExample(params: {
  datasetName: string;
  input: {
    lead: {
      firstName?: string;
      lastName?: string;
      company?: string;
      title?: string;
    };
    query?: string;
  };
  expectedOutput?: {
    summary?: string;
    sources?: Array<{ title: string; link: string; snippet: string }>;
  };
  metadata?: Record<string, any>;
}) {
  const langfuse = getLangfuseClient();
  
  return langfuse.createDatasetItem({
    datasetName: params.datasetName,
    input: params.input,
    expectedOutput: params.expectedOutput,
    metadata: params.metadata,
  });
}

/**
 * Run experiments on a dataset
 * Use this to test different prompts or models
 */
export async function runExperiment(params: {
  datasetName: string;
  runName: string;
  items: Array<{
    itemId: string;
    traceId: string;
  }>;
}) {
  const langfuse = getLangfuseClient();
  
  for (const item of params.items) {
    langfuse.createDatasetRun({
      datasetName: params.datasetName,
      datasetItemId: item.itemId,
      runName: params.runName,
      traceId: item.traceId,
    });
  }
  
  await langfuse.flushAsync();
}


