'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthHeaders } from '@/lib/auth-headers'

enum ViolationType {
  SPAM = 'SPAM',
  HATE_SPEECH = 'HATE_SPEECH',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SCAM = 'SCAM',
  FAKE_INFORMATION = 'FAKE_INFORMATION',
}

interface ViolationKeyword {
  id: string
  text: string
  createdAt: string
}

interface ViolationKeywordsManagerProps {
  apiUrl?: string
}

export function ViolationKeywordsManager({ apiUrl = 'http://localhost:8888' }: ViolationKeywordsManagerProps) {
  // Thay đổi type của state để chứa objects
  const [keywords, setKeywords] = React.useState<Map<string, ViolationKeyword[]>>(new Map())
  const [selectedType, setSelectedType] = React.useState<ViolationType>(ViolationType.SPAM)
  const [newKeyword, setNewKeyword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [adding, setAdding] = React.useState(false)

  React.useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/admin/violation-keywords`, {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        // Backend trả về grouped objects: { [type]: [{ id, text, createdAt }, ...] }
        const keywordsData = data.data as Record<string, ViolationKeyword[]>
        const keywordsMap = new Map<string, ViolationKeyword[]>(Object.entries(keywordsData))
        setKeywords(keywordsMap)
      }
    } catch (error) {
      console.error('Error fetching keywords:', error)
      toast.error('Không thể tải từ khóa vi phạm')
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error('Vui lòng nhập từ khóa')
      return
    }

    setAdding(true)
    try {
      const response = await fetch(`${apiUrl}/admin/violation-keywords`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: selectedType,
          keyword: newKeyword.trim(),
        }),
      })

      if (response.ok) {
        toast.success('Từ khóa đã được thêm thành công')
        setNewKeyword('')
        fetchKeywords()
      } else {
        throw new Error('Failed to add keyword')
      }
    } catch (error) {
      console.error('Error adding keyword:', error)
      toast.error('Không thể thêm từ khóa')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveKeyword = async (type: string, keywordText: string) => {
    try {
      const response = await fetch(`${apiUrl}/admin/violation-keywords/remove`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type,
          keyword: keywordText,
        }),
      })

      if (response.ok) {
        toast.success('Keyword removed successfully')
        fetchKeywords()
      } else {
        throw new Error('Failed to remove keyword')
      }
    } catch (error) {
      console.error('Error removing keyword:', error)
      toast.error('Failed to remove keyword')
    }
  }

  const typeLabels: Record<ViolationType, string> = {
    [ViolationType.SPAM]: 'Spam',
    [ViolationType.HATE_SPEECH]: 'Hate Speech',
    [ViolationType.HARASSMENT]: 'Harassment',
    [ViolationType.INAPPROPRIATE_CONTENT]: 'Inappropriate Content',
    [ViolationType.SCAM]: 'Scam',
    [ViolationType.FAKE_INFORMATION]: 'Fake Information',
  }

  const currentKeywords = keywords.get(selectedType) || []

  return (
    <div className="space-y-6">
      {/* Add Keyword Form */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Add Violation Keyword</CardTitle>
          <CardDescription>
            Add new keywords to improve the automatic violation detection system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="violation-type">Violation Type</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as ViolationType)}
              >
                <SelectTrigger id="violation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="keyword">Keyword</Label>
              <div className="flex gap-2">
                <Input
                  id="keyword"
                  placeholder="Enter keyword..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddKeyword()
                    }
                  }}
                />
                <Button onClick={handleAddKeyword} disabled={adding || !newKeyword.trim()}>
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Keyword List - {typeLabels[selectedType]}</CardTitle>
          <CardDescription>
            {currentKeywords.length} keywords are being monitored
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : currentKeywords.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No keywords found for this violation type</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentKeywords.map((item, index) => (
                <Badge
                  key={item.id || index}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm"
                >
                  {/* Bây giờ item là object, ta phải render item.text */}
                  <span>{item.text}</span>
                  <button
                    onClick={() => handleRemoveKeyword(selectedType, item.text)}
                    className="hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Keywords will be used to automatically scan content</li>
                <li>Be careful when adding keywords to avoid false positives</li>
                <li>Keywords are case-insensitive</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
