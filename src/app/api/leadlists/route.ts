import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearLeadlistCache, getLeadlistCache, setLeadlistCache, type LeadlistCachePayload } from './cache';

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

const SAMPLE_LEADS: LeadPayload[] = [
  {
    id: 'sample-1',
    firstName: 'Jade',
    lastName: 'Saunders',
    company: 'Sunway Safaris',
    email: 'jade@sunway-safaris.com',
    title: 'Marketing & HR Admin',
    website: 'https://www.sunway-safaris.com',
    linkedin: 'https://linkedin.com/in/jade-saunders',
    status: 'new',
  },
  {
    id: 'sample-2',
    firstName: 'Monique',
    lastName: 'Coetzee',
    company: 'Associated Automotive Distributors',
    email: 'vos@atlantismotors.co.za',
    title: 'Procurement & Logistics',
    website: 'https://atlantismotors.co.za',
    linkedin: 'https://linkedin.com/in/monique-coetzee',
    status: 'new',
  },
];

function isTableMissingError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = typeof (error as { code?: unknown }).code === 'string' ? (error as { code: string }).code : undefined;
  const message = typeof (error as { message?: unknown }).message === 'string' ? (error as { message: string }).message : '';
  const normalizedMessage = message.toLowerCase();
  return (
    code === '42P01' ||
    (normalizedMessage.includes('relation') && normalizedMessage.includes('does not exist'))
  );
}

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

export async function GET() {
  try {
    const cached = getLeadlistCache();
    if (cached) {
      return NextResponse.json(cached);
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const payload: LeadlistCachePayload = {
        ok: true,
        data: [
          {
            id: 'sample-list',
            name: 'Sample Leads',
            createdAt: new Date().toISOString(),
            leads: SAMPLE_LEADS,
          },
        ],
      };
      setLeadlistCache(payload);
      return NextResponse.json(payload);
    }

    const supabase = await createClient();

    const { data: lists, error: listsError } = await supabase
      .from('leadlists')
      .select('*')
      .eq('company_id', MOCK_COMPANY_ID)
      .order('created_at', { ascending: false });

    if (listsError) throw listsError;

    if (!lists?.length) {
      const payload: LeadlistCachePayload = { ok: true, data: [] };
      setLeadlistCache(payload);
      return NextResponse.json(payload);
    }

    const listIds = (lists as LeadlistRow[]).map((l) => l.id);

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('leadlist_id', listIds);

    if (leadsError) throw leadsError;

    const leadMap = ((leads as LeadRow[] | null) || []).reduce<Record<string, LeadRow[]>>((acc, row) => {
      const key = row.leadlist_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    const result = (lists as LeadlistRow[]).map((list) => ({
      id: list.id,
      name: list.name,
      createdAt: list.created_at,
      leads: (leadMap[list.id] || []).map(mapLeadRow),
    }));

    const payload: LeadlistCachePayload = { ok: true, data: result };
    setLeadlistCache(payload);
    return NextResponse.json(payload);
  } catch (e) {
    if (isTableMissingError(e)) {
      console.warn('Leadlists tables are missing. Returning fallback response.');
      const payload: LeadlistCachePayload = {
        ok: false,
        error: 'Lead storage tables are not provisioned yet. Using local sample data.',
        supabaseDisabled: true,
        data: [
          {
            id: 'sample-list',
            name: 'Sample Leads',
            createdAt: new Date().toISOString(),
            leads: SAMPLE_LEADS,
          },
        ],
      };
      setLeadlistCache(payload);
      return NextResponse.json(payload);
    }
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { name, leads = [], companyId, description, source, tags = [] } = body ?? {} as {
      name?: string;
      leads?: LeadPayload[];
      companyId?: string;
      description?: string | null;
      source?: string | null;
      tags?: string[];
    };

    if (!name) {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const finalCompanyId = companyId || MOCK_COMPANY_ID;

    const { data: list, error: listError } = await supabase
      .from('leadlists')
      .insert({
        company_id: finalCompanyId,
        name,
        description: description || null,
        source: source || null,
        tags,
      })
      .select('*')
      .single();

    if (listError) throw listError;

    if (Array.isArray(leads) && leads.length) {
      const insertPayload = (leads as LeadPayload[]).map((lead) => ({
        leadlist_id: list.id,
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

    clearLeadlistCache();

    return NextResponse.json({
      ok: true,
      data: {
        id: list.id,
        name: list.name,
        createdAt: list.created_at,
        leads,
      },
    }, { status: 201 });
  } catch (e) {
    if (isTableMissingError(e)) {
      console.warn('Leadlists tables are missing. Rejecting write request with fallback notice.');
      return NextResponse.json({
        ok: false,
        error: 'Lead storage tables are not provisioned yet. Remote persistence is disabled.',
        supabaseDisabled: true,
      }, { status: 200 });
    }
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
