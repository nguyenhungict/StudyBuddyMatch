import Cookies from 'js-cookie';

const LOCAL_API = '/api/resource';
const UPLOAD_API = '/api/upload';

export async function getResources() {
  const res = await fetch(LOCAL_API);
  if (!res.ok) throw new Error(`Fetch resources failed (${res.status})`);
  return res.json();
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(UPLOAD_API, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json();
}

export async function createResource(payload: {
  title: string;
  description?: string;
  subject?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
}) {
  const res = await fetch(LOCAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create resource failed (${res.status})`);
  return res.json();
}

export async function deleteResource(id: string) {
  const token = Cookies.get('accessToken');
  console.log('Delete token:', token ? 'exists' : 'missing');

  const res = await fetch(`${LOCAL_API}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error('Delete failed:', res.status, errorText);
    throw new Error(`Delete resource failed (${res.status})`);
  }
  return res.json();
}

export async function downloadResource(id: string) {
  const res = await fetch(`${LOCAL_API}/${id}/download`);
  if (!res.ok) throw new Error(`Download resource failed (${res.status})`);

  // Get filename from content-disposition header
  const contentDisposition = res.headers.get('content-disposition');
  let filename = 'download';

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  // Create blob and trigger download
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}