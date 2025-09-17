export type Folder = {
  id: string;
  company_id: string | null;
  name: string;
  parent_id: string | null;
};

export type Prompt = {
  id: string;
  company_id: string | null;
  folder_id: string | null;
  name: string;
  description: string | null;
  content: string;
  variables: string[];
  version: number;
};

export type CampaignPrompt = {
  id: string;
  campaign_id: string;
  prompt_id: string;
  prompt_name: string;
  prompt_version: number;
  prompt_content: string;
  attached_at: string;
};

