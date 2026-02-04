/**
 * Service for managing matches (study buddy matches)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888"

export interface MatchUser {
    id: string
    email: string
    profile?: {
        username?: string
        school?: string
        avatarUrl?: string
        bio?: string
        tagLevel?: { name: string }
        tagSubject?: { name: string }
        tagGender?: { name: string }
        photos?: Array<{ photoUrl: string }>
    }
}

export interface Match {
    id: string
    user1Id: string
    user2Id: string
    status: string
    createdAt: string
    endAt?: string
    user1: MatchUser
    user2: MatchUser
}

/**
 * Get all matches for a user
 */
export async function getMatches(userId: string): Promise<Match[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/matches?userId=${userId}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch matches: ${res.statusText}`)
        }

        return await res.json()
    } catch (error) {
        console.error("Error fetching matches:", error)
        throw error
    }
}

/**
 * Unmatch (end match) with a user
 */
export async function unmatch(matchId: string, userId: string): Promise<void> {
    try {
        const res = await fetch(`${API_BASE_URL}/matches/${matchId}?userId=${userId}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to unmatch: ${res.statusText}`)
        }
    } catch (error) {
        console.error("Error unmatching:", error)
        throw error
    }
}

/**
 * Get match between two users
 */
export async function getMatchBetweenUsers(
    userId: string,
    otherUserId: string
): Promise<Match | null> {
    try {
        const res = await fetch(
            `${API_BASE_URL}/matches/with/${otherUserId}?userId=${userId}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        if (!res.ok) {
            if (res.status === 404) {
                return null
            }
            throw new Error(`Failed to fetch match: ${res.statusText}`)
        }

        return await res.json()
    } catch (error) {
        console.error("Error fetching match:", error)
        throw error
    }
}
