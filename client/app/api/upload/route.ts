import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

export async function POST(req: Request) {
    try {
        // Get the form data from the request
        const formData = await req.formData();

        // Forward the FormData to the backend
        const resp = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
        });

        const result = await resp.json();
        return NextResponse.json(result, { status: resp.status });
    } catch (err: any) {
        console.error('Upload proxy error:', err);
        return NextResponse.json(
            { success: false, error: err?.message || String(err) },
            { status: 500 }
        );
    }
}
