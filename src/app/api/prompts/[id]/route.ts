import { NextResponse } from 'next/server';
import { deletePrompt, getPrompt, updatePrompt } from '@/lib/promptStore';

// GET /api/prompts/:id
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const item = await getPrompt(params.id);
    if (!item) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, data: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// PATCH /api/prompts/:id -> { name?, tags?, newContent? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as Record<string, unknown> | null;
    const updated = await updatePrompt(params.id, body ?? {});
    if (!updated) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// DELETE /api/prompts/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const ok = await deletePrompt(params.id);
    if (!ok) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
