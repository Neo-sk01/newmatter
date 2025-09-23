export type PromptTemplateRow = {
  id: string;
  name: string;
  goal?: string | null;
  audience?: string | null;
  channel?: string | null;
  created_at: string;
};

export type PromptVersionRow = {
  id: string;
  template_id: string;
  version: number;
  label: string;
  body: string;
  created_at: string;
  author?: string | null;
  notes?: string | null;
  status?: string | null;
};

export type PromptCachePayload = {
  ok: boolean;
  data: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    versions: PromptVersionRow[];
    tags: unknown[];
  }>;
  error?: string;
  supabaseDisabled?: boolean;
};

const PROMPT_CACHE_TTL_MS = 60_000;

type PromptCacheEntry = {
  payload: PromptCachePayload;
  expires: number;
};

let promptCache: PromptCacheEntry | null = null;

export function getPromptCache(): PromptCachePayload | null {
  if (promptCache && promptCache.expires > Date.now()) {
    return promptCache.payload;
  }
  if (promptCache && promptCache.expires <= Date.now()) {
    promptCache = null;
  }
  return null;
}

export function setPromptCache(payload: PromptCachePayload) {
  promptCache = {
    payload,
    expires: Date.now() + PROMPT_CACHE_TTL_MS,
  };
}

export function clearPromptCache() {
  promptCache = null;
}
