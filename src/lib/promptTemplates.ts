import type { SupabaseClient } from '@supabase/supabase-js'
import type { Folder, Prompt } from '@/types/prompting'

export async function listPromptTree(
  supabase: SupabaseClient
): Promise<{ folders: Folder[]; prompts: Prompt[] }> {
  const [foldersRes, promptsRes] = await Promise.all([
    supabase.from('prompt_folders').select('*').order('name', { ascending: true }),
    supabase.from('prompts').select('*').eq('is_archived', false).order('name', { ascending: true }),
  ])
  if (foldersRes.error) throw foldersRes.error
  if (promptsRes.error) throw promptsRes.error
  // Cast types safely
  const folders = (foldersRes.data ?? []) as unknown as Folder[]
  const prompts = (promptsRes.data ?? []) as unknown as Prompt[]
  return { folders, prompts }
}

export async function clonePrompt(
  supabase: SupabaseClient,
  promptId: string,
  companyFolderId: string,
  companyId: string
): Promise<Prompt> {
  const { data, error } = await supabase.from('prompts').select('*').eq('id', promptId).single()
  if (error || !data) throw error ?? new Error('Prompt not found')
  const src = data as unknown as Prompt
  const insert = {
    company_id: companyId,
    folder_id: companyFolderId,
    name: src.name,
    description: src.description,
    content: src.content,
    variables: src.variables,
    version: 1,
    is_archived: false,
  }
  const ins = await supabase.from('prompts').insert(insert).select('*').single()
  if (ins.error || !ins.data) throw ins.error ?? new Error('Clone failed')
  return ins.data as unknown as Prompt
}

export async function attachPromptToCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  prompt: { id: string; name: string; version: number; content: string }
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('campaign_prompts')
    .insert({
      campaign_id: campaignId,
      prompt_id: prompt.id,
      prompt_name: prompt.name,
      prompt_version: prompt.version,
      prompt_content: prompt.content,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('Attach failed')
  return { id: data.id as string }
}

export function renderTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>
): string {
  // Simple Mustache-like replacement: {{var}}
  return template.replace(/{{\s*([a-zA-Z0-9_\.]+)\s*}}/g, (_m, key: string) => {
    const v = vars[key]
    if (v === null || v === undefined) return ''
    return String(v)
  })
}

