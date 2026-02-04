"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  FileText,
  LogOut,
  Loader2,
} from "lucide-react"
import { StatCardSkeleton, ChartSkeleton } from "@/components/loading-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { type TrendStats } from "@/lib/mock-admin-data"
import { getAuthHeaders } from "@/lib/auth-headers"
import { apiFetch } from "@/lib/api-client"

interface TrendItem {
  name: string
  count: number
  percentage: number
}

interface UserGrowthDataItem {
  date: string
  activeUsers: number
  newUsers: number
}

interface AdminStats {
  pendingReports: number
  resolvedReports: number
  violationsToday: number
  activeUsers: number
  reportsByType: Record<string, number>
  reportsByStatus: Record<string, number>
  popularSubjects: TrendItem[]
  popularLevels: TrendItem[]
  popularLearningGoals: TrendItem[]
  popularStudyStyles: TrendItem[]
  userGrowthData?: UserGrowthDataItem[]
  trends?: {
    pendingReports: TrendStats
    resolvedReports: TrendStats
    violationsToday: TrendStats
    activeUsers: TrendStats
  }
}


export default function AdminDashboardPage() {
  const { logout } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState<AdminStats>({
    pendingReports: 0,
    resolvedReports: 0,
    violationsToday: 0,
    activeUsers: 0,
    reportsByType: {},
    reportsByStatus: {},
    popularSubjects: [],
    popularLevels: [],
    popularLearningGoals: [],
    popularStudyStyles: [],
  })
  const [timePeriod, setTimePeriod] = useState<string>("30d")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888"

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      const response = await apiFetch(`${apiUrl}/admin/dashboard/stats?period=${timePeriod}`, {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      } else {
        console.error("Failed to fetch stats:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [apiUrl, timePeriod])

  useEffect(() => {
    fetchStats(false) // Initial load

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(true) // Refresh (background)
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchStats])



  // Prepare chart data
  const userGrowthData = stats.userGrowthData || []

  const reportTypeData = Object.entries(stats.reportsByType).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count,
    color: ['#eab308', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'][
      Object.keys(stats.reportsByType).indexOf(type) % 7
    ],
  }))

  const reportStatusData = [
    { name: 'Pending', value: stats.reportsByStatus.PENDING || 0, color: '#eab308' },
    { name: 'Resolved', value: stats.reportsByStatus.RESOLVED || 0, color: '#22c55e' },
    { name: 'Rejected', value: stats.reportsByStatus.REJECTED || 0, color: '#ef4444' },
  ]

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Stat card component with trends
  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    iconBgColor,
    iconColor
  }: {
    title: string
    value: number
    icon: any
    trend?: TrendStats
    iconBgColor: string
    iconColor: string
  }) => (
    <Card className="border-border bg-card hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-card-foreground mb-2">{value}</p>
            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage}%
                </span>
                <span className="text-xs text-muted-foreground">vs previous</span>
              </div>
            )}
          </div>
          <div className={`h-14 w-14 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <Icon className={`h-7 w-7 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">Moderation management and data analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Refreshing...</span>
                </div>
              )}
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Pending"
                value={stats.pendingReports}
                icon={Clock}
                trend={stats.trends?.pendingReports}
                iconBgColor="bg-yellow-500/10"
                iconColor="text-yellow-600"
              />
              <StatCard
                title="Resolved"
                value={stats.resolvedReports}
                icon={CheckCircle}
                trend={stats.trends?.resolvedReports}
                iconBgColor="bg-green-500/10"
                iconColor="text-green-600"
              />
              <StatCard
                title="Violations Today"
                value={stats.violationsToday}
                icon={AlertTriangle}
                trend={stats.trends?.violationsToday}
                iconBgColor="bg-red-500/10"
                iconColor="text-red-600"
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                icon={Users}
                trend={stats.trends?.activeUsers}
                iconBgColor="bg-blue-500/10"
                iconColor="text-blue-600"
              />
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    User Growth
                  </CardTitle>
                  <CardDescription>Number of active users over time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Active Users"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="New Users"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Report Types Bar Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Reports by Violation Type
              </CardTitle>
              <CardDescription>Distribution of reported violation types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[8, 8, 0, 0]}>
                    {reportTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Report Status Pie Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Report Status
              </CardTitle>
              <CardDescription>Distribution of report processing status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={reportStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject Trends Area Chart */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📚 Subject Trends
              </CardTitle>
              <CardDescription>Top 5 most popular subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.popularSubjects.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Number of Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section - Horizontal Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Popular Levels */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">🎓 Popular Education Levels</CardTitle>
              <CardDescription>Distribution by education level</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.popularLevels && stats.popularLevels.length > 0 ? (
                <div className="space-y-3">
                  {stats.popularLevels.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.count} users ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Popular Learning Goals */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">🎯 Learning Goals</CardTitle>
              <CardDescription>Most selected learning goals</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.popularLearningGoals && stats.popularLearningGoals.length > 0 ? (
                <div className="space-y-3">
                  {stats.popularLearningGoals.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.count} users ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
