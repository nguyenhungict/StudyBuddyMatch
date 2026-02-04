"use client";

import { useEffect, useState } from "react";

interface MessageSearchPanelProps {
  roomId: string;
  onSelect: (messageId: string) => void;
  hiddenMessageIds: string[];
}

export default function MessageSearchPanel({
  roomId,
  onSelect,
  hiddenMessageIds,
}: MessageSearchPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
const API_URL = process.env.NEXT_PUBLIC_ACTIONS_URL;

if (!API_URL) {
  console.error("NEXT_PUBLIC_API_URL is undefined");
  setResults([]);
  setLoading(false);
  return;
}

const res = await fetch(
  `${API_URL}/messages/search?roomId=${roomId}&keyword=${encodeURIComponent(
    keyword.trim()
  )}`
);

if (!res.ok) {
  const text = await res.text();
  console.error("Search API error:", res.status, text);
  setResults([]);
  setLoading(false);
  return;
}

const data = await res.json();
const filtered = (Array.isArray(data) ? data : []).filter((msg) => {
  // ❌ bỏ message đã revoke cho tất cả
  if (msg.isRevoked) return false;

  // ❌ bỏ message đã remove for me (hidden)
  if (hiddenMessageIds.includes(msg._id)) return false;

  return true;
});

setResults(filtered);


      } catch (e) {
        console.error("Search error:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetchData, 400); 
    return () => clearTimeout(t);
  }, [keyword, roomId]);

  return (
<div className="absolute top-14 right-4 z-50 rounded-2xl bg-gray-200 p-3 shadow-xl border border-gray-300">
      <div className="p-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search in chat..."
  className="w-full rounded-xl bg-gray-300 px-4 py-2 text-black outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="px-3 py-2 text-sm text-gray-400">
            Searching...
          </div>
        )}

        {!loading && results.length === 0 && keyword && (
          <div className="px-3 py-2 text-sm text-gray-500">
            No results found
          </div>
        )}

        {results.map((msg) => (
          <div
            key={msg._id}
            className="cursor-pointer px-3 py-2 hover:bg-gray-300 text-sm text-black"
            onClick={() => onSelect(msg._id)}
          >
            <div className="line-clamp-2">{msg.content || "📎 File / Image"}</div>
            <div className="text-xs text-gray-400">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
