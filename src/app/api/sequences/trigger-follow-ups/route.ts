import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * to automatically trigger follow-up emails when they're due.
 * 
 * Usage:
 * - Set up a cron job to call this endpoint every hour (or desired interval)
 * - Can be protected with an API key for security
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Get all emails that are due for follow-up
    const { data: dueEmails, error: fetchError } = await supabase
      .from('sent_emails')
      .select(`
        *,
        lead:leads(*),
        lead_sequence:lead_sequences(
          *,
          sequence:follow_up_sequences(
            *,
            sequence_steps:sequence_steps(*)
          )
        )
      `)
      .not('next_follow_up_due_at', 'is', null)
      .lte('next_follow_up_due_at', now)
      .in('status', ['sent', 'delivered', 'opened', 'clicked'])
      .order('next_follow_up_due_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching due follow-ups:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch due follow-ups' },
        { status: 500 }
      );
    }

    if (!dueEmails || dueEmails.length === 0) {
      return NextResponse.json({
        message: 'No follow-ups due at this time',
        processed: 0,
      });
    }

    const results = [];
    
    for (const email of dueEmails) {
      try {
        // Get the lead sequence and current step
        const leadSequence = Array.isArray(email.lead_sequence) 
          ? email.lead_sequence[0] 
          : email.lead_sequence;

        if (!leadSequence || leadSequence.status !== 'active') {
          // Skip if sequence is not active
          await supabase
            .from('sent_emails')
            .update({ next_follow_up_due_at: null })
            .eq('id', email.id);
          continue;
        }

        const sequence = leadSequence.sequence;
        const nextStepNumber = (email.follow_up_number || 0) + 1;
        const nextStep = sequence.sequence_steps?.find(
          (s: any) => s.step_number === nextStepNumber
        );

        if (!nextStep) {
          // No more steps in sequence, mark as completed
          await supabase
            .from('lead_sequences')
            .update({ 
              status: 'completed',
              completed_at: now
            })
            .eq('id', leadSequence.id);

          await supabase
            .from('sent_emails')
            .update({ next_follow_up_due_at: null })
            .eq('id', email.id);

          results.push({
            leadId: email.lead_id,
            status: 'completed',
            message: 'Sequence completed',
          });
          continue;
        }

        // Prepare the next email by replacing variables
        const lead = email.lead;
        const subject = replaceVariables(nextStep.subject_template, lead);
        const body = replaceVariables(nextStep.body_template, lead);

        // Calculate the next follow-up date
        const sentAt = new Date();
        const nextFollowUpStep = sequence.sequence_steps?.find(
          (s: any) => s.step_number === nextStepNumber + 1
        );
        const nextFollowUpDueAt = nextFollowUpStep
          ? calculateNextFollowUpDate(
              sentAt.toISOString(),
              nextFollowUpStep.delay_days,
              nextFollowUpStep.delay_hours
            )
          : null;

        // Record the new sent email
        const { data: newEmail, error: insertError } = await supabase
          .from('sent_emails')
          .insert({
            lead_id: email.lead_id,
            sequence_id: email.sequence_id,
            step_id: nextStep.id,
            lead_sequence_id: leadSequence.id,
            subject,
            body,
            is_follow_up: true,
            follow_up_number: nextStepNumber,
            sent_at: sentAt.toISOString(),
            next_follow_up_due_at: nextFollowUpDueAt,
            status: 'sent',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting follow-up email:', insertError);
          results.push({
            leadId: email.lead_id,
            status: 'error',
            message: insertError.message,
          });
          continue;
        }

        // Update the original email to clear next_follow_up_due_at
        await supabase
          .from('sent_emails')
          .update({ next_follow_up_due_at: null })
          .eq('id', email.id);

        // Update lead sequence current step
        await supabase
          .from('lead_sequences')
          .update({ current_step: nextStepNumber })
          .eq('id', leadSequence.id);

        results.push({
          leadId: email.lead_id,
          leadName: `${lead.first_name} ${lead.last_name}`,
          status: 'sent',
          followUpNumber: nextStepNumber,
          subject,
          nextDueAt: nextFollowUpDueAt,
        });

        // TODO: Integrate with actual email sending service (SendGrid, AWS SES, etc.)
        // For now, we're just recording the email in the database
        console.log(`Follow-up #${nextStepNumber} triggered for ${lead.email}`);

      } catch (error) {
        console.error('Error processing follow-up:', error);
        results.push({
          leadId: email.lead_id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Follow-ups processed',
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in trigger-follow-ups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to replace variables in templates
function replaceVariables(template: string, lead: any): string {
  return template
    .replace(/\{\{firstName\}\}/g, lead.first_name || '')
    .replace(/\{\{lastName\}\}/g, lead.last_name || '')
    .replace(/\{\{company\}\}/g, lead.company || '')
    .replace(/\{\{email\}\}/g, lead.email || '')
    .replace(/\{\{title\}\}/g, lead.title || '')
    .replace(/\{\{website\}\}/g, lead.website || '')
    .replace(/\{\{linkedin\}\}/g, lead.linkedin || '');
}

// Helper function to calculate next follow-up date
function calculateNextFollowUpDate(
  sentAt: string,
  delayDays: number,
  delayHours: number = 0
): string {
  const date = new Date(sentAt);
  date.setDate(date.getDate() + delayDays);
  date.setHours(date.getHours() + delayHours);
  return date.toISOString();
}

// GET endpoint to check status (useful for debugging)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data: dueEmails, error } = await supabase
      .from('sent_emails')
      .select(`
        id,
        subject,
        sent_at,
        next_follow_up_due_at,
        follow_up_number,
        lead:leads(first_name, last_name, email)
      `)
      .not('next_follow_up_due_at', 'is', null)
      .lte('next_follow_up_due_at', now)
      .in('status', ['sent', 'delivered', 'opened', 'clicked'])
      .order('next_follow_up_due_at', { ascending: true })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      currentTime: now,
      dueCount: dueEmails?.length || 0,
      dueSample: dueEmails || [],
    });
  } catch (error) {
    console.error('Error in GET trigger-follow-ups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

