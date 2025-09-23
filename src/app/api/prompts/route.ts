import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PromptTemplateRow = {
  id: string;
  name: string;
  goal?: string | null;
  audience?: string | null;
  channel?: string | null;
  created_at: string;
};

type PromptVersionRow = {
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
    const { data: templates, error: templatesError } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (templatesError) throw templatesError;

    // Get all versions for these templates
    const templateIds = (templates as PromptTemplateRow[] | null)?.map((t) => t.id) || [];
    const { data: versions, error: versionsError } = await supabase
      .from('prompt_versions')
      .select('*')
      .in('template_id', templateIds)
      .order('template_id, version', { ascending: true });

    if (versionsError) throw versionsError;

    // Group versions by template
    const versionsByTemplate = ((versions as PromptVersionRow[] | null) || []).reduce<Record<string, PromptVersionRow[]>>((acc, version) => {
      if (!acc[version.template_id]) acc[version.template_id] = [];
      acc[version.template_id].push(version);
      return acc;
    }, {});

    // Combine templates with their versions
    const prompts = ((templates as PromptTemplateRow[] | null) || []).map((template) => ({
      id: template.id,
      name: template.name,
      tags: [], // We'll add tags to templates later if needed
      createdAt: template.created_at,
      updatedAt: template.created_at, // Templates don't have updated_at yet
      versions: versionsByTemplate[template.id] || []
    }));

    return NextResponse.json({ ok: true, data: prompts });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// POST /api/prompts -> create prompt template and first version { name, content, goal?, audience?, channel?, variables? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { name, content, goal, audience, channel, variables = [], label = 'v1', notes = 'Initial version' } = body ?? {};
    
    if (!name || !content) {
      return NextResponse.json({ ok: false, error: 'name and content are required' }, { status: 400 });
    }

    // Create template first
    const { data: template, error: templateError } = await supabase
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

    // Create first version (version will be auto-assigned by trigger)
    const { data: version, error: versionError } = await supabase
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

    // Return in expected format
    const prompt = {
      id: template.id,
      name: template.name,
      tags: [],
      createdAt: template.created_at,
      updatedAt: template.created_at,
      versions: [version as PromptVersionRow]
    };

    return NextResponse.json({ ok: true, data: prompt }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
