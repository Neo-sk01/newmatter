import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/email-responses - Get email responses
// Query params: leadId, sentEmailId
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const sentEmailId = searchParams.get('sentEmailId');

    const supabase = await createClient();

    let query = supabase
      .from('email_responses')
      .select(`
        *,
        lead:leads(*),
        sent_email:sent_emails(*)
      `)
      .order('received_at', { ascending: false });

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    if (sentEmailId) {
      query = query.eq('sent_email_id', sentEmailId);
    }

    const { data: responses, error } = await query;

    if (error) {
      console.error('Error fetching email responses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email responses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error in GET /api/email-responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/email-responses - Record an email response
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sentEmailId, leadId, responseBody, sentiment, autoDetected } = body;

    if (!sentEmailId || !leadId) {
      return NextResponse.json(
        { error: 'sentEmailId and leadId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: response, error } = await supabase
      .from('email_responses')
      .insert({
        sent_email_id: sentEmailId,
        lead_id: leadId,
        response_body: responseBody || null,
        sentiment: sentiment || 'neutral',
        auto_detected: autoDetected || false,
        received_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording email response:', error);
      return NextResponse.json(
        { error: 'Failed to record email response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/email-responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

