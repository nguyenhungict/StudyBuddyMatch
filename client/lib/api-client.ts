/**
 * API Client with Ban Detection
 * Wraps fetch to automatically detect banned users and logout
 */

type FetchOptions = RequestInit & {
    headers?: HeadersInit
}

// Store for ban notification state
let banNotificationShown = false

/**
 * Show ban notification popup
 */
function showBanNotification(data: { message: string; code: string; bannedUntil?: string }) {
    if (banNotificationShown) return // Prevent multiple popups

    banNotificationShown = true

    const isPermanent = data.code === 'ERR_USER_BANNED_PERMANENT'
    const message = isPermanent
        ? 'Your account has been permanently banned due to violations of community guidelines.'
        : `Your account has been temporarily banned until ${data.bannedUntil ? new Date(data.bannedUntil).toLocaleString() : 'further notice'}.`

    // Simple browser alert for now (will be replaced with custom dialog later)
    alert(`Account Banned\n\n${message}\n\nYou will be logged out now.`)
}

/**
 * Logout user and redirect to signin
 */
function logoutUser() {
    // Clear auth data
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')

    // Redirect to signin
    window.location.href = '/signin'
}

/**
 * Enhanced fetch with ban detection
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
    try {
        const response = await fetch(url, options)

        // Check if response is 401 (Unauthorized)
        if (response.status === 401) {
            try {
                const data = await response.clone().json()

                // Check if it's a ban error
                if (data.code === 'ERR_USER_BANNED_PERMANENT' || data.code === 'ERR_USER_BANNED_TEMPORARY') {
                    showBanNotification(data)
                    logoutUser()

                    // Still throw the error for calling code to handle
                    throw new Error(data.message || 'Account banned')
                }
            } catch (parseError) {
                // If JSON parsing fails, just continue with normal error handling
            }
        }

        return response
    } catch (error) {
        // Re-throw error for normal error handling
        throw error
    }
}

/**
 * Reset ban notification state (for testing)
 */
export function resetBanNotificationState() {
    banNotificationShown = false
}
