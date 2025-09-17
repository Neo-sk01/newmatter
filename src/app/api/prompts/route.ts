import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PromptTemplateRow = {
  id: string;
  name: string;
  created_at: string;
  goal: string | null;
  audience: string | null;
  channel: string | null;
  variables: string[] | null;
};

type PromptVersionRow = {
  id: string;
  template_id: string;
  version: number;
  label: string | null;
  body: string;
  variables_resolved: Record<string, unknown> | null;
  notes: string | null;
  author: string | null;
  status: string | null;
  created_at: string;
};

type PromptResponse = {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versions: PromptVersionRow[];
};

const errorResponse = (error: unknown, status = 500) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ ok: false, error: message }, { status });
};

// GET /api/prompts -> list prompts with versions
export async function GET() {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local',
        data: [] // Return empty array for UI compatibility
      });
    }

    const supabase = await createClient();
    
    // Get all prompt templates
    const { data: templatesData, error: templatesError } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (templatesError) throw templatesError;

    const templates = (templatesData as PromptTemplateRow[] | null) ?? [];

    // Get all versions for these templates
    const templateIds = templates.map((template) => template.id);
    const { data: versionsData, error: versionsError } = await supabase
      .from('prompt_versions')
      .select('*')
      .in('template_id', templateIds)
      .order('template_id, version', { ascending: true });

    if (versionsError) throw versionsError;

    const versions = (versionsData as PromptVersionRow[] | null) ?? [];

    // Group versions by template
    const versionsByTemplate = versions.reduce<Record<string, PromptVersionRow[]>>((acc, version) => {
      if (!acc[version.template_id]) acc[version.template_id] = [];
      acc[version.template_id].push(version);
      return acc;
    }, {});

    // Combine templates with their versions
    const prompts: PromptResponse[] = templates.map((template) => ({
      id: template.id,
      name: template.name,
      tags: [],
      createdAt: template.created_at,
      updatedAt: template.created_at,
      versions: versionsByTemplate[template.id] ?? [],
    }));

    return NextResponse.json({ ok: true, data: prompts });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/prompts -> create prompt template and first version { name, content, goal?, audience?, channel?, variables? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = (await req.json()) as Partial<{
      name: string;
      content: string;
      goal: string;
      audience: string;
      channel: string;
      variables: string[];
      label: string;
      notes: string;
    }>;
    const { name, content, goal, audience, channel, variables = [], label = 'v1', notes = 'Initial version' } = body ?? {};
    
    if (!name || !content) {
      return NextResponse.json({ ok: false, error: 'name and content are required' }, { status: 400 });
    }

    // Create template first
    const { data: templateData, error: templateError } = await supabase
      .from('prompt_templates')
      .insert({
        name,
        goal: goal || null,
        audience: audience || null,
        channel: channel || null,
        variables: variables || []
      })
      .select('*')
      .single();

    if (templateError) throw templateError;

    const template = templateData as PromptTemplateRow | null;
    if (!template) {
      return errorResponse('Failed to create prompt template', 500);
    }

    // Create first version (version will be auto-assigned by trigger)
    const { data: versionData, error: versionError } = await supabase
      .from('prompt_versions')
      .insert({
        template_id: template.id,
        label,
        body: content,
        variables_resolved: {},
        notes,
        author: 'system', // TODO: Get from auth context
        status: 'draft'
      })
      .select('*')
      .single();

    if (versionError) throw versionError;

    const version = versionData as PromptVersionRow | null;
    if (!version) {
      return errorResponse('Failed to create prompt version', 500);
    }

    // Return in expected format
    const prompt = {
      id: template.id,
      name: template.name,
      tags: [],
      createdAt: template.created_at,
      updatedAt: template.created_at,
      versions: [version]
    };

    return NextResponse.json({ ok: true, data: prompt }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
