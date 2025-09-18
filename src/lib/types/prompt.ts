export type PromptVersion = {
  version: number;
  content: string;
  createdAt: string; // ISO timestamp
};

export type Prompt = {
  id: string; // uuid
  name: string;
  tags?: string[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  versions: PromptVersion[];
};

export type CampaignSelection = {
  promptId: string;
  version: number;
};

export type Campaign = {
  id: string; // uuid
  name: string;
  promptSelections: CampaignSelection[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
};
