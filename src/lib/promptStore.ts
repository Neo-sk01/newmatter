import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Prompt, PromptVersion, Campaign } from './types/prompt';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROMPTS_DIR = path.join(DATA_DIR, 'prompts');
const CAMPAIGNS_DIR = path.join(DATA_DIR, 'campaigns');

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  typeof error === 'object' && error !== null && 'code' in error;

async function ensureDirs() {
  await fs.mkdir(PROMPTS_DIR, { recursive: true });
  await fs.mkdir(CAMPAIGNS_DIR, { recursive: true });
}

function nowISO() {
  return new Date().toISOString();
}

function promptPath(id: string) {
  return path.join(PROMPTS_DIR, `${id}.json`);
}

function campaignPath(id: string) {
  return path.join(CAMPAIGNS_DIR, `${id}.json`);
}

export async function listPrompts(): Promise<Prompt[]> {
  await ensureDirs();
  const files = await fs.readdir(PROMPTS_DIR);
  const items: Prompt[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(PROMPTS_DIR, file), 'utf-8');
    items.push(JSON.parse(raw));
  }
  // newest updated first
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPrompt(id: string): Promise<Prompt | null> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(promptPath(id), 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function createPrompt(params: { name: string; content: string; tags?: string[]; }): Promise<Prompt> {
  await ensureDirs();
  const id = randomUUID();
  const createdAt = nowISO();
  const version: PromptVersion = { version: 1, content: params.content, createdAt };
  const prompt: Prompt = {
    id,
    name: params.name,
    tags: params.tags ?? [],
    createdAt,
    updatedAt: createdAt,
    versions: [version],
  };
  await fs.writeFile(promptPath(id), JSON.stringify(prompt, null, 2), 'utf-8');
  return prompt;
}

export async function updatePrompt(id: string, changes: { name?: string; tags?: string[]; newContent?: string; }): Promise<Prompt | null> {
  const prompt = await getPrompt(id);
  if (!prompt) return null;
  if (typeof changes.name === 'string') prompt.name = changes.name;
  if (Array.isArray(changes.tags)) prompt.tags = changes.tags;
  if (typeof changes.newContent === 'string') {
    const newVersion: PromptVersion = {
      version: (prompt.versions.at(-1)?.version ?? 0) + 1,
      content: changes.newContent,
      createdAt: nowISO(),
    };
    prompt.versions.push(newVersion);
  }
  prompt.updatedAt = nowISO();
  await fs.writeFile(promptPath(id), JSON.stringify(prompt, null, 2), 'utf-8');
  return prompt;
}

export async function deletePrompt(id: string): Promise<boolean> {
  await ensureDirs();
  try {
    await fs.unlink(promptPath(id));
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function listCampaigns(): Promise<Campaign[]> {
  await ensureDirs();
  const files = await fs.readdir(CAMPAIGNS_DIR);
  const items: Campaign[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(CAMPAIGNS_DIR, file), 'utf-8');
    items.push(JSON.parse(raw));
  }
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(campaignPath(id), 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function createCampaign(params: { name: string; promptSelections: Campaign['promptSelections']; }): Promise<Campaign> {
  await ensureDirs();
  const id = randomUUID();
  const createdAt = nowISO();
  const campaign: Campaign = {
    id,
    name: params.name,
    promptSelections: params.promptSelections ?? [],
    createdAt,
    updatedAt: createdAt,
  };
  await fs.writeFile(campaignPath(id), JSON.stringify(campaign, null, 2), 'utf-8');
  return campaign;
}

export async function updateCampaign(id: string, changes: Partial<Pick<Campaign, 'name' | 'promptSelections'>>): Promise<Campaign | null> {
  const campaign = await getCampaign(id);
  if (!campaign) return null;
  if (typeof changes.name === 'string') campaign.name = changes.name;
  if (Array.isArray(changes.promptSelections)) campaign.promptSelections = changes.promptSelections;
  campaign.updatedAt = nowISO();
  await fs.writeFile(campaignPath(id), JSON.stringify(campaign, null, 2), 'utf-8');
  return campaign;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  await ensureDirs();
  try {
    await fs.unlink(campaignPath(id));
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return false;
    throw error;
  }
}
