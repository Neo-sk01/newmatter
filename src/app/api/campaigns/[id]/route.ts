import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/campaigns/[id] -> get campaign by id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    
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
    const result = {
      id: campaign.id,
      name: campaign.name,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
      promptSelections: (campaign.campaign_prompts || []).map((cp: any) => ({
        promptId: cp.prompt_version_id,
        version: 1 // We'll need to get actual version from prompt_versions table
      }))
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// PATCH /api/campaigns/[id] -> update campaign { name?, promptSelections? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await req.json();
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
    if (promptSelections && Array.isArray(promptSelections)) {
      // Delete existing campaign_prompts
      const { error: deleteError } = await supabase
        .from('campaign_prompts')
        .delete()
        .eq('campaign_id', id);

      if (deleteError) throw deleteError;

      // Insert new campaign_prompts
      if (promptSelections.length > 0) {
        const campaignPrompts = promptSelections.map((selection: any) => ({
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

    const result = {
      id: updated.id,
      name: updated.name,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      promptSelections: (updated.campaign_prompts || []).map((cp: any) => ({
        promptId: cp.prompt_version_id,
        version: 1
      }))
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] -> delete campaign (soft delete by setting status to archived)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id } = params;

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

    const result = {
      id: deleted.id,
      name: deleted.name,
      createdAt: deleted.created_at,
      updatedAt: deleted.updated_at,
      promptSelections: []
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
