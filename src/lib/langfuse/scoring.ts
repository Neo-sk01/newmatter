import { getLangfuseClient } from "./client";

/**
 * Score types for evaluation
 */
export enum ScoreType {
  EMAIL_QUALITY = "email-quality",
  RESEARCH_RELEVANCE = "research-relevance",
  PERSONALIZATION = "personalization",
  PROFESSIONAL_TONE = "professional-tone",
  FACTUAL_ACCURACY = "factual-accuracy",
}

/**
 * Score a trace observation in Langfuse
 */
export async function scoreObservation(params: {
  traceId: string;
  observationId?: string;
  name: ScoreType | string;
  value: number; // 0-1 for numeric, or any number
  comment?: string;
  dataType?: "NUMERIC" | "CATEGORICAL" | "BOOLEAN";
}): Promise<void> {
  try {
    const langfuse = getLangfuseClient();
    
    langfuse.score({
      traceId: params.traceId,
      observationId: params.observationId,
      name: params.name,
      value: params.value,
      comment: params.comment,
      dataType: params.dataType || "NUMERIC",
    });

    // Flush to ensure score is sent
    await langfuse.flushAsync();
  } catch (error) {
    console.error("Failed to score observation:", error);
  }
}

/**
 * Score email quality (0-1 scale)
 */
export async function scoreEmailQuality(params: {
  traceId: string;
  quality: number; // 0 (poor) to 1 (excellent)
  comment?: string;
}): Promise<void> {
  return scoreObservation({
    traceId: params.traceId,
    name: ScoreType.EMAIL_QUALITY,
    value: params.quality,
    comment: params.comment,
    dataType: "NUMERIC",
  });
}

/**
 * Score research relevance (0-1 scale)
 */
export async function scoreResearchRelevance(params: {
  traceId: string;
  relevance: number; // 0 (not relevant) to 1 (highly relevant)
  comment?: string;
}): Promise<void> {
  return scoreObservation({
    traceId: params.traceId,
    name: ScoreType.RESEARCH_RELEVANCE,
    value: params.relevance,
    comment: params.comment,
    dataType: "NUMERIC",
  });
}

/**
 * Score personalization (0-1 scale)
 */
export async function scorePersonalization(params: {
  traceId: string;
  score: number; // 0 (generic) to 1 (highly personalized)
  comment?: string;
}): Promise<void> {
  return scoreObservation({
    traceId: params.traceId,
    name: ScoreType.PERSONALIZATION,
    value: params.score,
    comment: params.comment,
    dataType: "NUMERIC",
  });
}

/**
 * Batch score multiple dimensions
 */
export async function batchScoreEmail(params: {
  traceId: string;
  scores: {
    quality?: number;
    personalization?: number;
    professionalTone?: number;
  };
  comment?: string;
}): Promise<void> {
  const langfuse = getLangfuseClient();

  if (params.scores.quality !== undefined) {
    langfuse.score({
      traceId: params.traceId,
      name: ScoreType.EMAIL_QUALITY,
      value: params.scores.quality,
      comment: params.comment,
      dataType: "NUMERIC",
    });
  }

  if (params.scores.personalization !== undefined) {
    langfuse.score({
      traceId: params.traceId,
      name: ScoreType.PERSONALIZATION,
      value: params.scores.personalization,
      comment: params.comment,
      dataType: "NUMERIC",
    });
  }

  if (params.scores.professionalTone !== undefined) {
    langfuse.score({
      traceId: params.traceId,
      name: ScoreType.PROFESSIONAL_TONE,
      value: params.scores.professionalTone,
      comment: params.comment,
      dataType: "NUMERIC",
    });
  }

  await langfuse.flushAsync();
}


