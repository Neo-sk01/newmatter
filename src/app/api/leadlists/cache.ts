export type LeadlistCachePayload = {
  ok: boolean;
  data: Array<{
    id: string;
    name: string;
    createdAt: string;
    leads: unknown[];
  }>;
  error?: string;
  supabaseDisabled?: boolean;
};

const LEADLIST_CACHE_TTL_MS = 60_000;

type LeadlistCacheEntry = {
  payload: LeadlistCachePayload;
  expires: number;
};

let leadlistCache: LeadlistCacheEntry | null = null;

export function getLeadlistCache(): LeadlistCachePayload | null {
  if (leadlistCache && leadlistCache.expires > Date.now()) {
    return leadlistCache.payload;
  }
  if (leadlistCache && leadlistCache.expires <= Date.now()) {
    leadlistCache = null;
  }
  return null;
}

export function setLeadlistCache(payload: LeadlistCachePayload) {
  leadlistCache = {
    payload,
    expires: Date.now() + LEADLIST_CACHE_TTL_MS,
  };
}

export function clearLeadlistCache() {
  leadlistCache = null;
}
