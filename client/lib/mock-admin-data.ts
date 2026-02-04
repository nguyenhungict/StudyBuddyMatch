// Mock data for admin dashboard when database is not available

export interface MockModerationReport {
  id: string
  type: string
  source: string
  targetId: string
  targetType: string
  reporterId: string
  status: string
  createdAt: string
  severity?: string
  violationCount?: number
  reason?: string
}

export interface TimeSeriesDataPoint {
  date: string
  activeUsers: number
  newUsers: number
  returningUsers: number
  reports: number
  violations: number
}

export interface TrendStats {
  current: number
  previous: number
  change: number
  changePercentage: number
  isPositive: boolean
}

export interface ReportTypeData {
  type: string
  count: number
  percentage: number
  color: string
}

// Generate time-series data for the last 30 days
const generateTimeSeriesData = (): TimeSeriesDataPoint[] => {
  const data: TimeSeriesDataPoint[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Simulate realistic growth patterns - starting from ~100 users, growing to 150
    const baseUsers = 100 + (29 - i) * 1.7  // Gradual growth to 150
    const variance = Math.sin(i / 3) * 8

    data.push({
      date: date.toISOString().split('T')[0],
      activeUsers: Math.floor(baseUsers + variance),
      newUsers: Math.floor(1 + Math.random() * 3),  // 1-4 new users per day
      returningUsers: Math.floor((baseUsers + variance) * 0.75),
      reports: Math.floor(3 + Math.random() * 8),
      violations: Math.floor(1 + Math.random() * 5),
    })
  }

  return data
}

export const mockTimeSeriesData = generateTimeSeriesData()

// Calculate trends
const calculateTrend = (current: number, previous: number): TrendStats => {
  const change = current - previous
  const changePercentage = previous > 0 ? Math.round((change / previous) * 100) : 0

  return {
    current,
    previous,
    change,
    changePercentage,
    isPositive: change >= 0,
  }
}

export const mockAdminStats = {
  pendingReports: 15,
  resolvedReports: 142,
  violationsToday: 8,
  activeUsers: 150, // Match seeds.ts user count
  reportsByType: {
    SPAM: 45,
    HATE_SPEECH: 12,
    HARASSMENT: 8,
    INAPPROPRIATE_CONTENT: 23,
    SCAM: 5,
    FAKE_INFORMATION: 7,
    OTHER: 3,
  },
  reportsByStatus: {
    PENDING: 15,
    RESOLVED: 142,
    REJECTED: 8,
  },
  // Subjects from seeds.ts - distributed across 150 users
  popularSubjects: [
    { name: 'Toán học', count: 28, percentage: 19 },      // math
    { name: 'Tiếng Anh', count: 24, percentage: 16 },     // english
    { name: 'Vật lý', count: 18, percentage: 12 },        // physics
    { name: 'Hóa học', count: 16, percentage: 11 },       // chemistry
    { name: 'Tin học', count: 15, percentage: 10 },       // computer
    { name: 'Ngữ văn', count: 14, percentage: 9 },        // literature
    { name: 'Sinh học', count: 12, percentage: 8 },       // biology
    { name: 'Lịch sử', count: 10, percentage: 7 },        // history
    { name: 'Địa lý', count: 8, percentage: 5 },          // geography
    { name: 'Mỹ thuật', count: 5, percentage: 3 },        // art
  ],
  // Levels from seeds.ts - distributed across 150 users
  popularLevels: [
    { name: 'THPT', count: 60, percentage: 40 },          // high school
    { name: 'Đại học', count: 45, percentage: 30 },       // university
    { name: 'THCS', count: 30, percentage: 20 },          // middle school
    { name: 'Tiểu học', count: 12, percentage: 8 },       // elementary
    { name: 'Sau đại học', count: 3, percentage: 2 },     // graduate
  ],
  // Learning goals from seeds.ts - distributed across 150 users
  popularLearningGoals: [
    { name: 'Thi cử', count: 40, percentage: 27 },                    // exam
    { name: 'Cải thiện điểm số', count: 35, percentage: 23 },         // improve
    { name: 'Hiểu sâu kiến thức', count: 28, percentage: 19 },        // understand
    { name: 'Luyện tập', count: 22, percentage: 15 },                 // practice
    { name: 'Ôn tập', count: 15, percentage: 10 },                    // review
    { name: 'Làm bài tập', count: 10, percentage: 7 },                // homework
  ],
  // Study styles from seeds.ts - distributed across 150 users
  popularStudyStyles: [
    { name: 'Học nhóm', count: 35, percentage: 23 },                  // group
    { name: 'Học bằng hình ảnh', count: 30, percentage: 20 },         // visual
    { name: 'Học bằng thực hành', count: 28, percentage: 19 },        // kinesthetic
    { name: 'Học bằng đọc', count: 25, percentage: 17 },              // reading
    { name: 'Học cá nhân', count: 18, percentage: 12 },               // individual
    { name: 'Học bằng âm thanh', count: 14, percentage: 9 },          // auditory
  ],
  // Trend data
  trends: {
    pendingReports: calculateTrend(15, 12),
    resolvedReports: calculateTrend(142, 135),
    violationsToday: calculateTrend(8, 10),
    activeUsers: calculateTrend(150, 143),
  },
}

// Report type data for charts
export const mockReportTypeData: ReportTypeData[] = [
  { type: 'SPAM', count: 45, percentage: 44, color: '#eab308' },
  { type: 'HATE_SPEECH', count: 12, percentage: 12, color: '#ef4444' },
  { type: 'HARASSMENT', count: 8, percentage: 8, color: '#f97316' },
  { type: 'INAPPROPRIATE', count: 23, percentage: 22, color: '#a855f7' },
  { type: 'SCAM', count: 5, percentage: 5, color: '#ec4899' },
  { type: 'FAKE_INFO', count: 7, percentage: 7, color: '#3b82f6' },
  { type: 'OTHER', count: 3, percentage: 3, color: '#6b7280' },
]


export const mockModerationReports: MockModerationReport[] = [
  {
    id: 'mod-001-abc-def-ghi',
    type: 'SPAM',
    source: 'USER_REPORT',
    targetId: 'msg-123',
    targetType: 'MESSAGE',
    reporterId: 'user-456',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    severity: 'medium',
    violationCount: 2,
    reason: 'Tin nhắn chứa nhiều link spam và nội dung quảng cáo',
  },
  {
    id: 'mod-002-abc-def-ghi',
    type: 'HATE_SPEECH',
    source: 'SYSTEM_SCAN',
    targetId: 'post-789',
    targetType: 'POST',
    reporterId: 'system',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    severity: 'high',
    violationCount: 4,
    reason: 'Phát hiện từ ngữ kỳ thị và lời nói ghét',
  },
  {
    id: 'mod-003-abc-def-ghi',
    type: 'HARASSMENT',
    source: 'USER_REPORT',
    targetId: 'user-321',
    targetType: 'USER',
    reporterId: 'user-654',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'critical',
    violationCount: 5,
    reason: 'Người dùng liên tục gửi tin nhắn quấy rối và đe dọa',
  },
  {
    id: 'mod-004-abc-def-ghi',
    type: 'INAPPROPRIATE_CONTENT',
    source: 'USER_REPORT',
    targetId: 'comment-555',
    targetType: 'COMMENT',
    reporterId: 'user-777',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'medium',
    violationCount: 1,
    reason: 'Bình luận chứa nội dung không phù hợp với cộng đồng',
  },
  {
    id: 'mod-005-abc-def-ghi',
    type: 'SCAM',
    source: 'SYSTEM_SCAN',
    targetId: 'msg-888',
    targetType: 'MESSAGE',
    reporterId: 'system',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    severity: 'high',
    violationCount: 3,
    reason: 'Phát hiện nội dung lừa đảo và phishing',
  },
  {
    id: 'mod-006-abc-def-ghi',
    type: 'FAKE_INFORMATION',
    source: 'USER_REPORT',
    targetId: 'post-999',
    targetType: 'POST',
    reporterId: 'user-111',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    severity: 'medium',
    violationCount: 2,
    reason: 'Bài viết chứa thông tin sai lệch và không chính xác',
  },
  {
    id: 'mod-007-abc-def-ghi',
    type: 'SPAM',
    source: 'USER_REPORT',
    targetId: 'msg-222',
    targetType: 'MESSAGE',
    reporterId: 'user-333',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'low',
    violationCount: 1,
    reason: 'Tin nhắn spam quảng cáo sản phẩm',
  },
  {
    id: 'mod-008-abc-def-ghi',
    type: 'HARASSMENT',
    source: 'USER_REPORT',
    targetId: 'comment-444',
    targetType: 'COMMENT',
    reporterId: 'user-555',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    severity: 'high',
    violationCount: 3,
    reason: 'Bình luận có tính chất quấy rối và xúc phạm',
  },
]

export function getMockReports(filters?: {
  status?: string
  type?: string
}): MockModerationReport[] {
  let filtered = [...mockModerationReports]

  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter((r) => r.status === filters.status)
  }

  if (filters?.type && filters.type !== 'all') {
    filtered = filtered.filter((r) => r.type === filters.type)
  }

  return filtered
}
