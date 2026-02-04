export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

const API_URL = process.env.NEXT_PUBLIC_ACTIONS_URL!;
  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data.url) {
    throw new Error(data.error || "Upload failed");
  }

  return `${API_URL}${data.url}`;
}
