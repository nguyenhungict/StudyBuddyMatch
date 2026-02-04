"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Users, Search, ChevronLeft, ChevronRight, Ban, CheckCircle, Eye, UserX } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"
import { getAuthHeaders } from "@/lib/auth-headers"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

interface User {
    id: string
    email: string
    isActive: boolean
    createdAt: string
    role: { name: string }
    profile?: {
        username: string
        gender: string
        birthday: string
        school?: string
    }
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [showDetailDialog, setShowDetailDialog] = useState(false)

    // Confirmation dialog
    const { confirm, dialog } = useConfirmDialog()

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888"

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            })

            if (search) params.append("search", search)
            if (statusFilter !== "all") params.append("isActive", statusFilter)

            const response = await fetch(`${apiUrl}/admin/users?${params}`, {
                headers: getAuthHeaders(),
            })

            if (response.ok) {
                const data = await response.json()
                setUsers(data.data.users)
                setTotalPages(data.data.pagination.totalPages)
                setTotal(data.data.pagination.total)
            }
        } catch (error) {
            console.error("Error fetching users:", error)
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [page, statusFilter])

    const handleSearch = () => {
        setPage(1)
        fetchUsers()
    }

    const handleViewDetails = async (userId: string) => {
        try {
            const response = await fetch(`${apiUrl}/admin/users/${userId}`, {
                headers: getAuthHeaders(),
            })
            if (response.ok) {
                const data = await response.json()
                setSelectedUser(data.data)
                setShowDetailDialog(true)
            }
        } catch (error) {
            toast.error("Failed to load user details")
        }
    }

    const handleBanUser = async (userId: string, userEmail: string) => {
        const confirmed = await confirm({
            title: "Permanently Ban User",
            description: `Are you sure you want to permanently ban ${userEmail}? The user will not be able to access the platform until manually unbanned by an admin.`,
            confirmText: "Yes, Ban Permanently",
            cancelText: "Cancel",
            variant: "destructive"
        })

        if (!confirmed) return

        try {
            const response = await fetch(`${apiUrl}/admin/users/${userId}/ban`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason: "Violated community guidelines" }),
            })

            if (response.ok) {
                toast.success("User banned successfully")
                fetchUsers()
            }
        } catch (error) {
            toast.error("Failed to ban user")
        }
    }

    const handleUnbanUser = async (userId: string, userEmail: string) => {
        const confirmed = await confirm({
            title: "Unban User",
            description: `Are you sure you want to unban ${userEmail}? The user will regain full access to the platform immediately.`,
            confirmText: "Yes, Unban User",
            cancelText: "Cancel",
            variant: "default"
        })

        if (!confirmed) return

        try {
            const response = await fetch(`${apiUrl}/admin/users/${userId}/unban`, {
                method: "POST",
                headers: getAuthHeaders(),
            })

            if (response.ok) {
                toast.success("User unbanned successfully")
                fetchUsers()
            }
        } catch (error) {
            toast.error("Failed to unban user")
        }
    }

    return (
        <div className="container max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-card-foreground">Users Management</h1>
                        <p className="text-muted-foreground">Manage user accounts and permissions</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                />
                                <Button onClick={handleSearch}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Banned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users List</CardTitle>
                    <CardDescription>Total: {total} users</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : users.length === 0 ? (
                        <EmptyState
                            icon={UserX}
                            title="No Users Found"
                            description="No users match your current search and filter criteria. Try adjusting your filters or search terms."
                            action={{
                                label: "Clear Filters",
                                onClick: () => {
                                    setSearch("")
                                    setStatusFilter("all")
                                }
                            }}
                        />
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>School</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.profile?.username || "No profile"}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role.name === "ADMIN" ? "default" : "secondary"}>
                                                    {user.role.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.isActive ? "default" : "destructive"}>
                                                    {user.isActive ? "Active" : "Banned"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {user.profile?.school || "N/A"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(user.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {user.isActive ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleBanUser(user.id, user.email)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleUnbanUser(user.id, user.email)}
                                                            className="text-green-600 hover:text-green-700"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages} •  Total: {total} users
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Jump to page */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Go to:</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={totalPages}
                                            className="w-20"
                                            placeholder="Page"
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter") {
                                                    const value = parseInt((e.target as HTMLInputElement).value)
                                                    if (value >= 1 && value <= totalPages) {
                                                        setPage(value)
                                                    }
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Page numbers */}
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>

                                        {/* First page */}
                                        {page > 3 && (
                                            <>
                                                <Button
                                                    variant={page === 1 ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setPage(1)}
                                                    className="w-10"
                                                >
                                                    1
                                                </Button>
                                                {page > 4 && <span className="px-2 py-1">...</span>}
                                            </>
                                        )}

                                        {/* Pages around current */}
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter((p) => {
                                                return p === page || Math.abs(p - page) <= 2
                                            })
                                            .map((p) => (
                                                <Button
                                                    key={p}
                                                    variant={p === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setPage(p)}
                                                    className="w-10"
                                                >
                                                    {p}
                                                </Button>
                                            ))}

                                        {/* Last page */}
                                        {page < totalPages - 2 && (
                                            <>
                                                {page < totalPages - 3 && <span className="px-2 py-1">...</span>}
                                                <Button
                                                    variant={page === totalPages ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setPage(totalPages)}
                                                    className="w-10"
                                                >
                                                    {totalPages}
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            {dialog}

            {/* User Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>Detailed information about the user</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-4">
                            <div>
                                <h3 className="font-semibold mb-2">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Name:</span>{" "}
                                        {selectedUser.profile?.username}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Email:</span> {selectedUser.email}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Gender:</span>{" "}
                                        {selectedUser.profile?.gender}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">School:</span>{" "}
                                        {selectedUser.profile?.school || "N/A"}
                                    </div>
                                </div>
                            </div>
                            {selectedUser.profile && (
                                <div>
                                    <h3 className="font-semibold mb-2">Study Preferences</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Subject:</span>{" "}
                                            {selectedUser.profile.tagSubject?.name}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Level:</span>{" "}
                                            {selectedUser.profile.tagLevel?.name}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Study Style:</span>{" "}
                                            {selectedUser.profile.tagStudyStyle?.name}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Learning Goal:</span>{" "}
                                            {selectedUser.profile.tagLearningGoal?.name}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
