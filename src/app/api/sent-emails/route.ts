import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/sent-emails - Get sent emails with optional filters
// Query params: leadId, sequenceId, status
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const sequenceId = searchParams.get('sequenceId');
    const status = searchParams.get('status');

    const supabase = await createClient();

    let query = supabase
      .from('sent_emails')
      .select(`
        *,
        lead:leads(*),
        sequence:follow_up_sequences(name),
        step:sequence_steps(step_number, delay_days),
        response:email_responses(*)
      `)
      .order('sent_at', { ascending: false });

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    if (sequenceId) {
      query = query.eq('sequence_id', sequenceId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error('Error fetching sent emails:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sent emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error in GET /api/sent-emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sent-emails - Record a sent email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      leadId,
      sequenceId,
      stepId,
      leadSequenceId,
      subject,
      body: emailBody,
      isFollowUp,
      followUpNumber,
      nextFollowUpDueAt,
    } = body;

    if (!leadId || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'leadId, subject, and body are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: sentEmail, error } = await supabase
      .from('sent_emails')
      .insert({
        lead_id: leadId,
        sequence_id: sequenceId || null,
        step_id: stepId || null,
        lead_sequence_id: leadSequenceId || null,
        subject,
        body: emailBody,
        is_follow_up: isFollowUp || false,
        follow_up_number: followUpNumber || null,
        next_follow_up_due_at: nextFollowUpDueAt || null,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording sent email:', error);
      return NextResponse.json(
        { error: 'Failed to record sent email' },
        { status: 500 }
      );
    }

    // If this is part of a sequence, update the lead_sequence current_step
    if (leadSequenceId && followUpNumber) {
      await supabase
        .from('lead_sequences')
        .update({
          current_step: followUpNumber,
        })
        .eq('id', leadSequenceId);
    }

    return NextResponse.json({ sentEmail }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sent-emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/sent-emails - Update a sent email status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailId, status, responseReceivedAt } = body;

    if (!emailId) {
      return NextResponse.json(
        { error: 'emailId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: any = {};
    if (status) updateData.status = status;
    if (responseReceivedAt) updateData.response_received_at = responseReceivedAt;

    const { data: sentEmail, error } = await supabase
      .from('sent_emails')
      .update(updateData)
      .eq('id', emailId)
      .select()
      .single();

    if (error) {
      console.error('Error updating sent email:', error);
      return NextResponse.json(
        { error: 'Failed to update sent email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sentEmail });
  } catch (error) {
    console.error('Error in PATCH /api/sent-emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/sent-emails/due - Get emails due for follow-up
export async function due(req: NextRequest) {
  try {
    const supabase = await createClient();

    const now = new Date().toISOString();

    const { data: emails, error } = await supabase
      .from('sent_emails')
      .select(`
        *,
        lead:leads(*),
        sequence:follow_up_sequences(name),
        step:sequence_steps(*)
      `)
      .not('next_follow_up_due_at', 'is', null)
      .lte('next_follow_up_due_at', now)
      .eq('status', 'sent')
      .order('next_follow_up_due_at', { ascending: true });

    if (error) {
      console.error('Error fetching due follow-ups:', error);
      return NextResponse.json(
        { error: 'Failed to fetch due follow-ups' },
        { status: 500 }
      );
    }

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error in GET /api/sent-emails/due:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

