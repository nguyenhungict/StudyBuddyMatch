import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { photos } = body; // Array of base64 images

        // Get auth token from cookies - using 'accessToken' (camelCase)
        const token = request.cookies.get('accessToken')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Forward to backend
        const response = await fetch(`${API_URL}/users/profile-photos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ photos }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error uploading profile photos:', error);
        return NextResponse.json(
            { error: 'Failed to upload photos' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('accessToken')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get profile photos from backend
        const response = await fetch(`${API_URL}/users/profile-photos`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching profile photos:', error);
        return NextResponse.json(
            { error: 'Failed to fetch photos' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const photoId = searchParams.get('id');

        if (!photoId) {
            return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
        }

        const token = request.cookies.get('accessToken')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete photo from backend
        const response = await fetch(`${API_URL}/users/profile-photos/${photoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting profile photo:', error);
        return NextResponse.json(
            { error: 'Failed to delete photo' },
            { status: 500 }
        );
    }
}

