import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Next.js 15: params is now a Promise
        const params = await context.params;
        const id = params.id;

        // Forward download request to backend
        const resp = await fetch(`${API_BASE}/resource/${id}/download`);

        if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.message || 'Download failed' },
                { status: resp.status }
            );
        }

        // Get the file blob
        const blob = await resp.blob();

        // Get content-disposition header from backend
        const contentDisposition = resp.headers.get('content-disposition');
        const contentType = resp.headers.get('content-type') || 'application/octet-stream';

        // Create response with proper headers for download
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        if (contentDisposition) {
            headers.set('Content-Disposition', contentDisposition);
        }

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || String(err) },
            { status: 500 }
        );
    }
}
