// Test script to create a post
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:8888';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

async function testCreatePost() {
    try {
        const formData = new FormData();
        formData.append('content', 'Test post from script');

        const response = await fetch(`${API_BASE}/community`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
            },
            body: formData,
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testCreatePost();
