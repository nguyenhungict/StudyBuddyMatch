import Cookies from "js-cookie"

/**
 * Get authentication headers with real JWT token
 */
export function getAuthHeaders(): HeadersInit {
    const token = Cookies.get("accessToken") || localStorage.getItem("accessToken")

    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
    }
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | undefined {
    return Cookies.get("accessToken") || localStorage.getItem("accessToken") || undefined
}
