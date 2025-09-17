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
  campaign_prompts: CampaignPromptRow[] | null;
};

type PromptSelectionPayload = {
  promptId: string;
  version?: number;
};

const toPromptSelections = (
  prompts: CampaignPromptRow[] | null | undefined,
): PromptSelectionPayload[] =>
  (prompts ?? []).map((prompt) => ({
    promptId: prompt.prompt_version_id,
    version: 1,
  }));

const errorResponse = (error: unknown, status = 500) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ ok: false, error: message }, { status });
};

// GET /api/campaigns/[id] -> get campaign by id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        campaign_prompts (
          id,
          prompt_version_id,
          delivery_channel,
          ab_group,
          status
        )
      `)
      .eq('id', id)
      .single();

    const campaign = data as CampaignRow | null;

    if (error) throw error;
    if (!campaign) {
      return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Transform to expected format
    const result = {
      id: campaign.id,
      name: campaign.name,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
      promptSelections: toPromptSelections(campaign.campaign_prompts),
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/campaigns/[id] -> update campaign { name?, promptSelections? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = (await req.json()) as Partial<{
      name: string;
      promptSelections: unknown;
    }>;
    const { name, promptSelections } = body;

    // Update campaign name if provided
    if (name) {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ name })
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // Update prompt selections if provided
    if (Array.isArray(promptSelections)) {
      const selections = promptSelections.filter((selection): selection is PromptSelectionPayload => (
        typeof selection === 'object'
        && selection !== null
        && 'promptId' in selection
        && typeof (selection as { promptId: unknown }).promptId === 'string'
      ));

      // Delete existing campaign_prompts
      const { error: deleteError } = await supabase
        .from('campaign_prompts')
        .delete()
        .eq('campaign_id', id);

      if (deleteError) throw deleteError;

      // Insert new campaign_prompts
      if (selections.length > 0) {
        const campaignPrompts = selections.map((selection) => ({
          campaign_id: id,
          prompt_version_id: selection.promptId,
          delivery_channel: 'email',
          ab_group: 'A',
          status: 'draft'
        }));

        const { error: insertError } = await supabase
          .from('campaign_prompts')
          .insert(campaignPrompts);

        if (insertError) throw insertError;
      }
    }

    // Fetch updated campaign
    const { data: updatedData, error: fetchError } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        campaign_prompts (
          id,
          prompt_version_id,
          delivery_channel,
          ab_group,
          status
        )
      `)
      .eq('id', id)
      .single();

    const updated = updatedData as CampaignRow | null;

    if (fetchError) throw fetchError;
    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 });
    }

    const result = {
      id: updated.id,
      name: updated.name,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      promptSelections: toPromptSelections(updated.campaign_prompts),
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/campaigns/[id] -> delete campaign (soft delete by setting status to archived)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: deletedData, error } = await supabase
      .from('campaigns')
      .update({ status: 'archived' })
      .eq('id', id)
      .select(`id, name, created_at, updated_at, campaign_prompts`)
      .single();

    const deleted = deletedData as CampaignRow | null;

    if (error) throw error;
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 });
    }

    const result = {
      id: deleted.id,
      name: deleted.name,
      createdAt: deleted.created_at,
      updatedAt: deleted.updated_at,
      promptSelections: []
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
