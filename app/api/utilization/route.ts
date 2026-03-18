import { NextResponse } from 'next/server';

const MAGICLINE_API = 'https://fit-inn-trier.open-api.magicline.com/v1';
const API_KEY = process.env.MAGICLINE_API_KEY!;

export async function GET() {
  try {
    const res = await fetch(`${MAGICLINE_API}/studios/utilization`, {
      headers: { 'x-api-key': API_KEY },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`Magicline error: ${res.status}`);
    const data = await res.json();

    return NextResponse.json({
      count: data.count ?? 0,
      capacity: data.capacity ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'API nicht erreichbar' }, { status: 500 });
  }
}
