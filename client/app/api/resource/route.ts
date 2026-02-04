import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

async function forwardJsonResponse(resp: Response) {
  const text = await resp.text();
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: resp.status });
  } catch {
    return new NextResponse(text, { status: resp.status });
  }
}

export async function GET() {
  try {
    const resp = await fetch(`${API_BASE}/resource`);
    return await forwardJsonResponse(resp);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const formData = await req.formData();

    const resp = await fetch(`${API_BASE}/resource`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
      },
      body: formData,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Upload failed' },
        { status: resp.status }
      );
    }

    return await forwardJsonResponse(resp);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
