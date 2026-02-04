const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888"

export type SwipeTarget = {
  id: string
  email?: string
  profile?: any
  studySlots?: any[]
}

export type SmartFilters = {
  subject?: string
  studyDays?: string[]
  studyTimes?: string[]
}

export async function getSwipeTargets(
  swiperId: string,
  limit = 10,
  filters?: SmartFilters
): Promise<SwipeTarget[]> {
  const params = new URLSearchParams({
    swiperId,
    limit: limit.toString(),
  })

  // Add filter parameters if provided
  if (filters?.subject) {
    params.append('subject', filters.subject)
  }
  if (filters?.studyDays && filters.studyDays.length > 0) {
    params.append('studyDays', filters.studyDays.join(','))
  }
  if (filters?.studyTimes && filters.studyTimes.length > 0) {
    params.append('studyTimes', filters.studyTimes.join(','))
  }

  const url = `${BASE_URL}/swipes/targets?${params.toString()}`
  const res = await fetch(url, { cache: "no-store" })

  if (!res.ok) {
    throw new Error(`Failed to fetch targets: ${res.status}`)
  }
  return res.json()
}

export async function createSwipe(swiperId: string, targetId: string, like: boolean) {
  const url = `${BASE_URL}/swipes?swiperId=${encodeURIComponent(swiperId)}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetId, like }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Swipe failed: ${res.status}`)
  }

  return res.json()
}

