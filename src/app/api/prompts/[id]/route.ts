import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearPromptCache, type PromptTemplateRow, type PromptVersionRow } from '../cache';

async function mapPromptById(id: string) {
  const supabase = await createClient();

  const { data: template, error: templateError } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (templateError) {
    if (templateError.code === 'PGRST116') return null;
    throw templateError;
  }

  const { data: versions, error: versionsError } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('template_id', id)
    .order('version', { ascending: true });

  if (versionsError) throw versionsError;

  return {
    id: (template as PromptTemplateRow).id,
    name: (template as PromptTemplateRow).name,
    tags: [],
    createdAt: (template as PromptTemplateRow).created_at,
    updatedAt: (template as PromptTemplateRow).created_at,
    versions: (versions as PromptVersionRow[]) || [],
  };
}

// GET /api/prompts/:id
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const item = await mapPromptById(id);
    if (!item) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, data: item });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// PATCH /api/prompts/:id -> { name?, tags?, newContent? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();
    const supabase = await createClient();

    if (body?.name) {
      const { error } = await supabase
        .from('prompt_templates')
        .update({ name: body.name })
        .eq('id', id);
      if (error) throw error;
    }

    if (typeof body?.newContent === 'string') {
      const { error } = await supabase
        .from('prompt_versions')
        .insert({
          template_id: id,
          body: body.newContent,
          variables_resolved: {},
          notes: body.notes ?? 'Updated via API',
          author: body.author ?? 'system',
          status: body.status ?? 'draft',
        });
      if (error) throw error;
    }

    clearPromptCache();

    const updated = await mapPromptById(id);
    if (!updated) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// DELETE /api/prompts/:id
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    clearPromptCache();

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
