import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type CampaignPromptRow = {
  id: string;
  prompt_version_id: string;
  delivery_channel: string | null;
  ab_group: string | null;
  status: string | null;
};

type CampaignRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  leadlist_id: string | null;
  campaign_prompts: CampaignPromptRow[] | null;
};

type PromptSelectionPayload = {
  promptId: string;
  version?: number;
};

type CampaignResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  promptSelections: PromptSelectionPayload[];
};

const mapPromptSelections = (prompts: CampaignPromptRow[] | null | undefined): PromptSelectionPayload[] =>
  (prompts ?? []).map((prompt) => ({
    promptId: prompt.prompt_version_id,
    version: 1,
  }));

const toCampaignResponse = (campaign: CampaignRow): CampaignResponse => ({
  id: campaign.id,
  name: campaign.name,
  createdAt: campaign.created_at,
  updatedAt: campaign.updated_at,
  promptSelections: mapPromptSelections(campaign.campaign_prompts),
});

const errorResponse = (error: unknown, status = 500) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ ok: false, error: message }, { status });
};

// GET /api/campaigns -> list campaigns with prompt selections
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
    
    // For now, we'll create a mock company_id and leadlist_id
    // In production, these would come from the authenticated user's context
    const mockCompanyId = '00000000-0000-0000-0000-000000000001';
    
    // Get campaigns for the company
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_prompts (
          id,
          prompt_version_id,
          delivery_channel,
          ab_group,
          status
        )
      `)
      .eq('company_id', mockCompanyId)
      .order('created_at', { ascending: false });

    const campaigns = (campaignsData as CampaignRow[] | null) ?? [];

    if (campaignsError) throw campaignsError;

    // Transform to match expected format
    const transformedCampaigns = campaigns.map(toCampaignResponse);

    return NextResponse.json({ ok: true, data: transformedCampaigns });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/campaigns -> create campaign { name, promptSelections?, companyId?, leadlistId? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = (await req.json()) as Partial<{
      name: string;
      promptSelections: unknown;
      companyId: string;
      leadlistId: string;
    }>;
    const { name, promptSelections = [], companyId, leadlistId } = body;
    
    if (!name) {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
    }

    // Use mock IDs if not provided (in production, get from auth context)
    const finalCompanyId = companyId || '00000000-0000-0000-0000-000000000001';
    const finalLeadlistId = leadlistId || '00000000-0000-0000-0000-000000000002';

    // Create campaign
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        company_id: finalCompanyId,
        leadlist_id: finalLeadlistId,
        name,
        campaign_date: new Date().toISOString().split('T')[0], // Today's date
        objectives: 'Generated via API',
        status: 'draft'
      })
      .select('*')
      .single();

    const campaign = campaignData as CampaignRow | null;

    if (campaignError) throw campaignError;
    if (!campaign) {
      return errorResponse('Failed to create campaign', 500);
    }

    // Create campaign_prompts entries if promptSelections provided
    if (Array.isArray(promptSelections) && promptSelections.length > 0) {
      const selections = promptSelections.filter((selection): selection is PromptSelectionPayload => (
        typeof selection === 'object'
        && selection !== null
        && 'promptId' in selection
        && typeof (selection as { promptId: unknown }).promptId === 'string'
      ));

      if (selections.length > 0) {
        const campaignPrompts = selections.map((selection) => ({
          campaign_id: campaign.id,
          prompt_version_id: selection.promptId,
          delivery_channel: 'email',
          ab_group: 'A',
          status: 'draft'
        }));

        const { error: promptsError } = await supabase
          .from('campaign_prompts')
          .insert(campaignPrompts);

        if (promptsError) throw promptsError;
      }
    }

    // Return in expected format
    const result = toCampaignResponse(campaign);

    // Preserve caller-provided promptSelections version values if present
    if (Array.isArray(promptSelections)) {
      result.promptSelections = promptSelections.filter((selection): selection is PromptSelectionPayload => (
        typeof selection === 'object'
        && selection !== null
        && 'promptId' in selection
        && typeof (selection as { promptId: unknown }).promptId === 'string'
      ));
    }

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
