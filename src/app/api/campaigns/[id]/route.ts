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

type PromptSelectionInput = {
  promptId: string;
  version?: number;
};

type CampaignResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  promptSelections: Array<{ promptId: string; version: number }>;
};

// GET /api/campaigns/[id] -> get campaign by id
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: campaign, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!campaign) {
      return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Transform to expected format
    const typedCampaign = campaign as CampaignRow;

    const result: CampaignResponse = {
      id: typedCampaign.id,
      name: typedCampaign.name,
      createdAt: typedCampaign.created_at,
      updatedAt: typedCampaign.updated_at,
      promptSelections: (typedCampaign.campaign_prompts ?? []).map((cp) => ({
        promptId: cp.prompt_version_id,
        version: 1,
      })),
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// PATCH /api/campaigns/[id] -> update campaign { name?, promptSelections? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = (await req.json()) as {
      name?: string;
      promptSelections?: PromptSelectionInput[];
    };
    const { name, promptSelections } = body;
    const sanitizedSelections = Array.isArray(promptSelections)
      ? promptSelections.filter((selection): selection is PromptSelectionInput & { promptId: string } => Boolean(selection?.promptId))
      : [];

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
      // Delete existing campaign_prompts
      const { error: deleteError } = await supabase
        .from('campaign_prompts')
        .delete()
        .eq('campaign_id', id);

      if (deleteError) throw deleteError;

      // Insert new campaign_prompts
      if (sanitizedSelections.length > 0) {
        const campaignPrompts = sanitizedSelections.map((selection) => ({
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
    const { data: updated, error: fetchError } = await supabase
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
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const typedUpdated = updated as CampaignRow;

    const result: CampaignResponse = {
      id: typedUpdated.id,
      name: typedUpdated.name,
      createdAt: typedUpdated.created_at,
      updatedAt: typedUpdated.updated_at,
      promptSelections: (typedUpdated.campaign_prompts ?? []).map((cp) => ({
        promptId: cp.prompt_version_id,
        version: 1,
      })),
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] -> delete campaign (soft delete by setting status to archived)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: deleted, error } = await supabase
      .from('campaigns')
      .update({ status: 'archived' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 });
    }

    const result: CampaignResponse = {
      id: deleted.id,
      name: deleted.name,
      createdAt: deleted.created_at,
      updatedAt: deleted.updated_at,
      promptSelections: [],
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
