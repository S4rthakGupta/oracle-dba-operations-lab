import { NextResponse } from 'next/server';
import { runQueries } from '@/lib/db';
import { LIVE } from '@/lib/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Read-only: only GET is exported, so POST/PUT/DELETE are refused by Next.
export async function GET() {
  const data = await runQueries('monitor', LIVE);
  return NextResponse.json({ ts: Date.now(), ...data }, { headers: { 'Cache-Control': 'no-store' } });
}
