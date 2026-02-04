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

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Next.js 15: params is now a Promise!
        const params = await context.params;
        const id = params.id;
        const authHeader = req.headers.get('authorization');

        const resp = await fetch(`${API_BASE}/resource/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader || '',
            },
        });

        return await forwardJsonResponse(resp);
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || String(err) },
            { status: 500 }
        );
    }
}
