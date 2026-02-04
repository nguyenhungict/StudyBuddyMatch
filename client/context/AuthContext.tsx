"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authService } from "@/lib/auth"
import { userService } from "@/lib/user"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { getSocket } from "@/utils/socketSingleton";
import { BanNotification } from "@/components/ban-notification";


interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  hasProfile: boolean;
}

interface AuthContextType {
  user: User | null
  login: (data: any) => Promise<void>
  logout: () => void
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Ban notification state
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [banInfo, setBanInfo] = useState<{ isPermanent: boolean; bannedUntil?: string }>({
    isPermanent: false,
  })

  const loadUserFromBackend = async () => {
    try {
      // Lấy token từ Cookie ra
      const token = Cookies.get("accessToken");

      if (token) {
        // 🔥 QUAN TRỌNG: Đồng bộ Token sang LocalStorage để Socket Video đọc được
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", token);
        }

        const data = await userService.getProfile()
        const userProfile = data.profile || {}

        // 1. Cập nhật User State
        const userData = {
          id: data.id,
          email: data.email,
          name: data.fullName || (data.email ? data.email.split("@")[0] : "User"),
          avatar: userProfile.avatarUrl || "",
          hasProfile: data.hasProfile
        }
        setUser(userData)

        // 2. Cập nhật LocalStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("isLoggedIn", "true")
          localStorage.setItem("userId", data.id) // Store userId for quiz

          if (userData.hasProfile) {
            const profileDataToSave = {
              name: data.fullName,
              school: userProfile.school,
              grade: userProfile.gradeLevel,
              age: userProfile.age,
              birthday: userProfile.birthday,
              gender: userProfile.gender,
              subjects: userProfile.subjects || [],
              studyDays: userProfile.studySchedule?.days || [],
              studyBlocks: (userProfile.studySchedule?.time && typeof userProfile.studySchedule.time === 'string')
                ? userProfile.studySchedule.time.split(", ")
                : [],
              studyStyle: userProfile.studyStyles || [],
              learningGoal: userProfile.learningGoals || [],
              achievement: userProfile.recentAchievement,
              bio: userProfile.bio,
              avatar: userProfile.avatarUrl
            }
            localStorage.setItem("profileData", JSON.stringify(profileDataToSave))
          } else {
            localStorage.removeItem("profileData")
          }
        }
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
      if ((error as any)?.response?.status === 401) {
        logout()
      }
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      await loadUserFromBackend()
      setLoading(false)
    }
    initAuth()
  }, [])

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();
    socket.emit("registerUser", user.id);

  }, [user?.id]);

  // 🚨 Ban Detection Polling - Check every 30 seconds
  useEffect(() => {
    if (!user?.id) return;

    const checkBanStatus = async () => {
      try {
        const token = Cookies.get("accessToken");
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
        const response = await fetch(`${apiUrl}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // If 401 Unauthorized, check if it's a ban
        if (response.status === 401) {
          try {
            const data = await response.json();

            // Check for ban error codes
            if (data.code === 'ERR_USER_BANNED_PERMANENT' || data.code === 'ERR_USER_BANNED_TEMPORARY') {
              const isPermanent = data.code === 'ERR_USER_BANNED_PERMANENT';

              // Set ban info and show dialog
              setBanInfo({
                isPermanent,
                bannedUntil: data.bannedUntil,
              });
              setShowBanDialog(true);
            }
          } catch (parseError) {
            // Ignore JSON parse errors
          }
        }
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.error('Ban check failed:', error);
      }
    };

    // Check immediately on mount
    checkBanStatus();

    // Then check every 15 seconds
    const interval = setInterval(checkBanStatus, 15000);

    return () => clearInterval(interval);
  }, [user?.id])

  const login = async (data: any) => {
    await authService.login(data)
    await loadUserFromBackend() // Hàm này chạy xong sẽ có Token trong LocalStorage
    router.push("/home")
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("profileData")
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("accessToken") // Xóa luôn token khi logout
      Cookies.remove("accessToken")
      Cookies.remove("user")
    }
    router.push("/login")
  }

  const refreshUser = async () => {
    await loadUserFromBackend()
  }

  const handleBanDialogClose = () => {
    setShowBanDialog(false)
    logout()
  }

  return (
    <>
      <BanNotification
        open={showBanDialog}
        isPermanent={banInfo.isPermanent}
        bannedUntil={banInfo.bannedUntil}
        onClose={handleBanDialogClose}
      />
      <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
        {children}
      </AuthContext.Provider>
    </>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}