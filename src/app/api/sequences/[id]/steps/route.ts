import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/sequences/[id]/steps - Get steps for a sequence
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await context.params;

    const supabase = await createClient();

    const { data: steps, error } = await supabase
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('step_number', { ascending: true });

    if (error) {
      console.error('Error fetching sequence steps:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sequence steps' },
        { status: 500 }
      );
    }

    return NextResponse.json({ steps });
  } catch (error) {
    console.error('Error in GET /api/sequences/[id]/steps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sequences/[id]/steps - Add a step to a sequence
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await context.params;
    const body = await req.json();
    const { stepNumber, delayDays, delayHours, subjectTemplate, bodyTemplate } = body;

    if (!subjectTemplate || !bodyTemplate) {
      return NextResponse.json(
        { error: 'subjectTemplate and bodyTemplate are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: step, error } = await supabase
      .from('sequence_steps')
      .insert({
        sequence_id: sequenceId,
        step_number: stepNumber || 1,
        delay_days: delayDays || 3,
        delay_hours: delayHours || 0,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sequence step:', error);
      return NextResponse.json(
        { error: 'Failed to create sequence step' },
        { status: 500 }
      );
    }

    return NextResponse.json({ step }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sequences/[id]/steps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/sequences/[id]/steps - Update a step
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await context.params;
    const body = await req.json();
    const { stepId, stepNumber, delayDays, delayHours, subjectTemplate, bodyTemplate, isActive } = body;

    if (!stepId) {
      return NextResponse.json(
        { error: 'stepId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: any = {};
    if (stepNumber !== undefined) updateData.step_number = stepNumber;
    if (delayDays !== undefined) updateData.delay_days = delayDays;
    if (delayHours !== undefined) updateData.delay_hours = delayHours;
    if (subjectTemplate !== undefined) updateData.subject_template = subjectTemplate;
    if (bodyTemplate !== undefined) updateData.body_template = bodyTemplate;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: step, error } = await supabase
      .from('sequence_steps')
      .update(updateData)
      .eq('id', stepId)
      .eq('sequence_id', sequenceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating sequence step:', error);
      return NextResponse.json(
        { error: 'Failed to update sequence step' },
        { status: 500 }
      );
    }

    return NextResponse.json({ step });
  } catch (error) {
    console.error('Error in PATCH /api/sequences/[id]/steps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sequences/[id]/steps - Delete a step
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sequenceId } = await context.params;
    const searchParams = req.nextUrl.searchParams;
    const stepId = searchParams.get('stepId');

    if (!stepId) {
      return NextResponse.json(
        { error: 'stepId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('sequence_steps')
      .delete()
      .eq('id', stepId)
      .eq('sequence_id', sequenceId);

    if (error) {
      console.error('Error deleting sequence step:', error);
      return NextResponse.json(
        { error: 'Failed to delete sequence step' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/sequences/[id]/steps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

