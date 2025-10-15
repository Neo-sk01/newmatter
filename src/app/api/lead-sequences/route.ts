import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/lead-sequences - Get lead sequences with timeline
// Query params: leadId, sequenceId, status
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const sequenceId = searchParams.get('sequenceId');
    const status = searchParams.get('status');

    const supabase = await createClient();

    let query = supabase
      .from('lead_sequences')
      .select(`
        *,
        lead:leads(*),
        sequence:follow_up_sequences(
          *,
          sequence_steps:sequence_steps(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    if (sequenceId) {
      query = query.eq('sequence_id', sequenceId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: leadSequences, error } = await query;

    if (error) {
      console.error('Error fetching lead sequences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lead sequences' },
        { status: 500 }
      );
    }

    // For each lead sequence, get the sent emails timeline
    const enrichedSequences = await Promise.all(
      leadSequences.map(async (ls) => {
        const { data: sentEmails } = await supabase
          .from('sent_emails')
          .select(`
            *,
            response:email_responses(*)
          `)
          .eq('lead_id', ls.lead_id)
          .eq('sequence_id', ls.sequence_id)
          .order('sent_at', { ascending: true });

        return {
          ...ls,
          sent_emails: sentEmails || [],
        };
      })
    );

    return NextResponse.json({ leadSequences: enrichedSequences });
  } catch (error) {
    console.error('Error in GET /api/lead-sequences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/lead-sequences - Start a sequence for a lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, sequenceId } = body;

    if (!leadId || !sequenceId) {
      return NextResponse.json(
        { error: 'leadId and sequenceId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if lead is already in this sequence
    const { data: existing } = await supabase
      .from('lead_sequences')
      .select('*')
      .eq('lead_id', leadId)
      .eq('sequence_id', sequenceId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Lead is already in this sequence' },
        { status: 400 }
      );
    }

    const { data: leadSequence, error } = await supabase
      .from('lead_sequences')
      .insert({
        lead_id: leadId,
        sequence_id: sequenceId,
        current_step: 0,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select(`
        *,
        lead:leads(*),
        sequence:follow_up_sequences(
          *,
          sequence_steps:sequence_steps(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating lead sequence:', error);
      return NextResponse.json(
        { error: 'Failed to start sequence for lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ leadSequence }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/lead-sequences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/lead-sequences - Update lead sequence status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadSequenceId, status, currentStep } = body;

    if (!leadSequenceId) {
      return NextResponse.json(
        { error: 'leadSequenceId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'paused') {
        updateData.paused_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (currentStep !== undefined) {
      updateData.current_step = currentStep;
    }

    const { data: leadSequence, error } = await supabase
      .from('lead_sequences')
      .update(updateData)
      .eq('id', leadSequenceId)
      .select(`
        *,
        lead:leads(*),
        sequence:follow_up_sequences(
          *,
          sequence_steps:sequence_steps(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error updating lead sequence:', error);
      return NextResponse.json(
        { error: 'Failed to update lead sequence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ leadSequence });
  } catch (error) {
    console.error('Error in PATCH /api/lead-sequences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/lead-sequences/timeline - Get full timeline for a lead
export async function timeline(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Use the helper function from the database
    const { data: timeline, error } = await supabase
      .rpc('get_lead_sequence_timeline', { p_lead_id: leadId });

    if (error) {
      console.error('Error fetching lead timeline:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lead timeline' },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error('Error in GET /api/lead-sequences/timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

