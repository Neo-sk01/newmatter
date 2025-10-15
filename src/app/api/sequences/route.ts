import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/sequences - Get all sequences for a company
// Query params: companyId (required)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: sequences, error } = await supabase
      .from('follow_up_sequences')
      .select(`
        *,
        sequence_steps:sequence_steps(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sequences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sequences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sequences });
  } catch (error) {
    console.error('Error in GET /api/sequences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sequences - Create a new sequence
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, name, description, steps } = body;

    if (!companyId || !name) {
      return NextResponse.json(
        { error: 'companyId and name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create the sequence
    const { data: sequence, error: sequenceError } = await supabase
      .from('follow_up_sequences')
      .insert({
        company_id: companyId,
        name,
        description,
      })
      .select()
      .single();

    if (sequenceError) {
      console.error('Error creating sequence:', sequenceError);
      return NextResponse.json(
        { error: 'Failed to create sequence' },
        { status: 500 }
      );
    }

    // If steps are provided, create them
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const stepsToInsert = steps.map((step: any, index: number) => ({
        sequence_id: sequence.id,
        step_number: index + 1,
        delay_days: step.delayDays || 3,
        delay_hours: step.delayHours || 0,
        subject_template: step.subjectTemplate,
        body_template: step.bodyTemplate,
      }));

      const { error: stepsError } = await supabase
        .from('sequence_steps')
        .insert(stepsToInsert);

      if (stepsError) {
        console.error('Error creating sequence steps:', stepsError);
        // Still return the sequence even if steps fail
      }
    }

    // Fetch the complete sequence with steps
    const { data: completeSequence, error: fetchError } = await supabase
      .from('follow_up_sequences')
      .select(`
        *,
        sequence_steps:sequence_steps(*)
      `)
      .eq('id', sequence.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ sequence });
    }

    return NextResponse.json({ sequence: completeSequence }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sequences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sequences - Delete a sequence
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sequenceId = searchParams.get('sequenceId');

    if (!sequenceId) {
      return NextResponse.json(
        { error: 'sequenceId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('follow_up_sequences')
      .delete()
      .eq('id', sequenceId);

    if (error) {
      console.error('Error deleting sequence:', error);
      return NextResponse.json(
        { error: 'Failed to delete sequence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/sequences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/sequences - Update a sequence
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { sequenceId, name, description, isActive } = body;

    if (!sequenceId) {
      return NextResponse.json(
        { error: 'sequenceId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: sequence, error } = await supabase
      .from('follow_up_sequences')
      .update(updateData)
      .eq('id', sequenceId)
      .select(`
        *,
        sequence_steps:sequence_steps(*)
      `)
      .single();

    if (error) {
      console.error('Error updating sequence:', error);
      return NextResponse.json(
        { error: 'Failed to update sequence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sequence });
  } catch (error) {
    console.error('Error in PATCH /api/sequences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

