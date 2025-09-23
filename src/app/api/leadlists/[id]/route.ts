import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearLeadlistCache } from '../cache';

type NormalizedError = {
  message: string;
  code?: string;
  details?: string;
};

function isTableMissingError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; message?: string };
  const code = typeof candidate.code === 'string' ? candidate.code : undefined;
  const message = typeof candidate.message === 'string' ? candidate.message : '';
  const normalized = message.toLowerCase();
  return (
    code === '42P01' ||
    (normalized.includes('relation') && normalized.includes('does not exist'))
  );
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    const maybeMessage =
      typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : undefined;
    const maybeDetails =
      typeof (error as { details?: unknown }).details === 'string'
        ? (error as { details: string }).details
        : undefined;
    const maybeCode =
      typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : undefined;

    if (maybeMessage || maybeCode || maybeDetails) {
      return {
        message: maybeMessage ?? maybeCode ?? 'Unknown error',
        code: maybeCode,
        details: maybeDetails,
      };
    }
  }

  return { message: 'Unknown error' };
}

type LeadlistRow = {
  id: string;
  name: string;
  created_at: string;
};

type LeadRow = {
  id: string;
  leadlist_id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  email: string | null;
  title: string | null;
  website: string | null;
  linkedin: string | null;
  status: string | null;
};

type LeadPayload = {
  id?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  title?: string;
  website?: string;
  linkedin?: string;
  status?: string;
};

const MOCK_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

function mapLeadRow(row: LeadRow) {
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    company: row.company ?? '',
    email: row.email ?? '',
    title: row.title ?? '',
    website: row.website ?? undefined,
    linkedin: row.linkedin ?? undefined,
    status: row.status ?? 'new',
  };
}

async function fetchLeadListById(id: string) {
  const supabase = await createClient();

  const { data: list, error: listError } = await supabase
    .from('leadlists')
    .select('*')
    .eq('id', id)
    .eq('company_id', MOCK_COMPANY_ID)
    .single();

  if (listError) {
    if (listError.code === 'PGRST116') return null;
    throw listError;
  }

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('leadlist_id', id);

  if (leadsError) throw leadsError;

  return {
    id: list.id,
    name: (list as LeadlistRow).name,
    createdAt: (list as LeadlistRow).created_at,
    leads: ((leads as LeadRow[] | null) || []).map(mapLeadRow),
  };
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const list = await fetchLeadListById(id);
    if (!list) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ok: true, data: list });
  } catch (e) {
    if (isTableMissingError(e)) {
      console.warn('Leadlists tables are missing. Cannot fetch detail.');
      return NextResponse.json({ ok: false, error: 'Lead storage tables are not provisioned yet.', supabaseDisabled: true }, { status: 200 });
    }
    const { message, code, details } = normalizeError(e);
    return NextResponse.json({ ok: false, error: message, code, details }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    const body = await req.json();
    const { name, leads, description, source, tags } = (body ?? {}) as {
      name?: string;
      leads?: LeadPayload[];
      description?: string | null;
      source?: string | null;
      tags?: string[];
    };

    if (name || description || source || Array.isArray(tags)) {
      const updates: {
        name?: string;
        description?: string | null;
        source?: string | null;
        tags?: string[];
      } = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (source !== undefined) updates.source = source;
      if (Array.isArray(tags)) updates.tags = tags;

      const { error: updateError } = await supabase
        .from('leadlists')
        .update(updates)
        .eq('id', id)
        .eq('company_id', MOCK_COMPANY_ID);

    if (updateError) throw updateError;
  }

  if (Array.isArray(leads)) {
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('leadlist_id', id);
      if (deleteError) throw deleteError;

      if (leads.length) {
        const insertPayload = (leads as LeadPayload[]).map((lead) => ({
          leadlist_id: id,
          first_name: lead.firstName ?? null,
          last_name: lead.lastName ?? null,
          company: lead.company ?? null,
          email: lead.email ?? null,
          title: lead.title ?? null,
          website: lead.website ?? null,
          linkedin: lead.linkedin ?? null,
          status: lead.status ?? 'new',
        }));

        const { error: insertError } = await supabase
          .from('leads')
          .insert(insertPayload);

        if (insertError) throw insertError;
      }
    }

    const updated = await fetchLeadListById(id);
    if (!updated) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    clearLeadlistCache();

    return NextResponse.json({ ok: true, data: updated });
  } catch (e) {
    if (isTableMissingError(e)) {
      console.warn('Leadlists tables are missing. Skipping update.');
      return NextResponse.json({ ok: false, error: 'Lead storage tables are not provisioned yet.', supabaseDisabled: true }, { status: 200 });
    }
    const { message, code, details } = normalizeError(e);
    return NextResponse.json({ ok: false, error: message, code, details }, { status: 500 });
  }
}

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
      .from('leadlists')
      .delete()
      .eq('id', id)
      .eq('company_id', MOCK_COMPANY_ID);

    if (error) throw error;

    clearLeadlistCache();

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isTableMissingError(e)) {
      console.warn('Leadlists tables are missing. Nothing to delete.');
      return NextResponse.json({ ok: false, error: 'Lead storage tables are not provisioned yet.', supabaseDisabled: true }, { status: 200 });
    }
    const { message, code, details } = normalizeError(e);
    return NextResponse.json({ ok: false, error: message, code, details }, { status: 500 });
  }
}
