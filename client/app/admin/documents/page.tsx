"use client"

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthHeaders } from "@/lib/auth-headers"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, Eye, Trash2, Search, Loader2, FileText, Image, Video, File } from "lucide-react"
import { toast } from "sonner"
import { ModerationReviewDialog } from "@/components/moderation-review-dialog"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"

interface Document {
    id: string
    title: string
    description?: string
    fileName?: string
    fileUrl?: string
    fileType?: string
    fileSize?: string
    status: string
    createdAt: string
    author: {
        id: string
        email: string
        profile: {
            username: string
        }
    }
}

export default function DocumentsManagementPage() {
    const [documents, setDocuments] = React.useState<Document[]>([])
    const [reportedDocs, setReportedDocs] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState('')
    const [previewDoc, setPreviewDoc] = React.useState<Document | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    // Generics for review dialog
    const [selectedReport, setSelectedReport] = React.useState<any>(null)
    const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false)

    // Confirmation dialog
    const { confirm, dialog } = useConfirmDialog()

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'

    React.useEffect(() => {
        fetchDocuments()
        fetchReportedDocuments()
    }, [])

    const fetchReportedDocuments = async () => {
        try {
            const token = localStorage.getItem('accessToken')
            const response = await fetch(`${apiUrl}/admin/document-reports`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const result = await response.json()
                setReportedDocs(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching reported documents:', error)
        }
    }

    const fetchDocuments = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await fetch(`${apiUrl}/admin/documents`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const result = await response.json()
                setDocuments(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching documents:', error)
            toast.error('Failed to load documents')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, docTitle: string) => {
        const confirmed = await confirm({
            title: "Delete Document",
            description: `Are you sure you want to delete "${docTitle}"? This will permanently remove the document and cannot be undone.`,
            confirmText: "Yes, Delete",
            cancelText: "Cancel",
            variant: "destructive"
        })

        if (!confirmed) return

        setDeletingId(id)
        try {
            const token = localStorage.getItem('accessToken')
            const response = await fetch(`${apiUrl}/admin/documents/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                toast.success('Document deleted successfully')
                fetchDocuments()
            } else {
                throw new Error('Failed to delete')
            }
        } catch (error) {
            console.error('Error deleting document:', error)
            toast.error('Failed to delete document')
        } finally {
            setDeletingId(null)
        }
    }

    const getFileIcon = (fileType?: string) => {
        if (!fileType) return <File className="h-4 w-4" />

        const type = fileType.toLowerCase()
        if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
        if (type.includes('powerpoint') || type.includes('ppt')) return <FileText className="h-4 w-4 text-orange-500" />
        if (type.includes('word') || type.includes('doc')) return <FileText className="h-4 w-4 text-blue-500" />
        if (type.includes('excel') || type.includes('xls')) return <FileText className="h-4 w-4 text-green-500" />
        if (type.includes('text') || type.includes('txt')) return <FileText className="h-4 w-4 text-gray-500" />

        return <File className="h-4 w-4" />
    }

    const handlePreviewReportedDoc = async (report: any) => {
        // Try to extract DocID from reason first (new format)
        const match = report.reason?.match(/\[DocID:([a-f0-9-]+)\]/);
        let docId = match?.[1];

        // If no DocID found, this is an old report
        if (!docId) {
            toast.error(
                "Cannot preview: This is an old report created before document tracking was implemented. " +
                "Please review the report details instead.",
                { duration: 5000 }
            );
            return;
        }

        // Show loading toast
        const loadingToast = toast.loading("Loading document preview...");

        try {
            // Check if doc is already in documents list (cache)
            const existing = documents.find((d) => d.id === docId);
            if (existing) {
                toast.dismiss(loadingToast);
                setPreviewDoc(existing);
                return;
            }

            // Fetch from API
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${apiUrl}/admin/documents/${docId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            toast.dismiss(loadingToast);

            if (res.ok) {
                const data = await res.json();
                setPreviewDoc(data.data);
                toast.success("Document loaded successfully");
            } else if (res.status === 404) {
                toast.error("Document not found (may have been deleted by author)");
            } else {
                toast.error("Failed to load document");
            }
        } catch (e) {
            toast.dismiss(loadingToast);
            console.error('Error loading document:', e);
            toast.error("Network error: Failed to load document");
        }
    }

    const handleReviewReport = (report: any) => {
        setSelectedReport(report)
        setReviewDialogOpen(true)
    }

    const handleReviewSubmitted = () => {
        fetchReportedDocuments()
        toast.success("Review submitted")
    }

    // Helper to convert relative URLs to absolute URLs pointing to backend
    const getFullFileUrl = (url: string) => {
        if (!url) return '';
        // If already absolute URL, return as-is
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // Otherwise prepend backend API URL
        return `${apiUrl}${url}`;
    }

    const renderPreview = (doc: Document) => {
        if (!doc.fileUrl) return <p className="text-muted-foreground">No preview available</p>

        const fullUrl = getFullFileUrl(doc.fileUrl);

        const type = doc.fileType?.toLowerCase() || ''

        // PDF preview
        if (type.includes('pdf')) {
            return (
                <div className="w-full">
                    <iframe
                        src={fullUrl}
                        className="w-full h-[600px] rounded-lg border"
                        title={doc.title}
                    />
                </div>
            )
        }

        // For other document types (PPT, DOCX, etc.) - use Google Docs Viewer
        if (type.includes('powerpoint') || type.includes('ppt') ||
            type.includes('word') || type.includes('doc') ||
            type.includes('excel') || type.includes('xls')) {
            return (
                <div className="w-full">
                    <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`}
                        className="w-full h-[600px] rounded-lg border"
                        title={doc.title}
                    />
                </div>
            )
        }

        // Text files
        if (type.includes('text') || type.includes('txt')) {
            return (
                <div className="w-full p-4 bg-gray-50 rounded-lg">
                    <iframe
                        src={fullUrl}
                        className="w-full h-[600px] bg-white rounded border"
                        title={doc.title}
                    />
                </div>
            )
        }

        // Fallback - download only
        return (
            <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                <p className="text-sm text-muted-foreground mb-4">File type: {doc.fileType}</p>
                <Button asChild>
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" download>
                        Download Document
                    </a>
                </Button>
            </div>
        )
    }

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.author.profile.username.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="container max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-card-foreground">Documents Management</h1>
                        <p className="text-muted-foreground">Manage uploaded documents and resources</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Documents</TabsTrigger>
                    <TabsTrigger value="reported" className="relative">
                        Reported Documents
                        {reportedDocs.length > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                {reportedDocs.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Documents List</CardTitle>
                                    <CardDescription>View and manage all uploaded documents</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search documents..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 w-[300px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredDocs.length === 0 ? (
                                <EmptyState
                                    icon={FolderOpen}
                                    title="No Documents Found"
                                    description="There are no documents matching your current filters. Try adjusting the tab or search criteria."
                                />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Author</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Upload Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDocs.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell>{getFileIcon(doc.fileType)}</TableCell>
                                                <TableCell className="font-medium">{doc.title}</TableCell>
                                                <TableCell>{doc.author.profile.username}</TableCell>
                                                <TableCell>{doc.fileSize || 'N/A'}</TableCell>
                                                <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={doc.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                                        {doc.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setPreviewDoc(doc)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(doc.id, doc.title)}
                                                            disabled={deletingId === doc.id}
                                                        >
                                                            {deletingId === doc.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reported">
                    <Card className="border-border bg-card">
                        <CardHeader>
                            <CardTitle>Reported Documents</CardTitle>
                            <CardDescription>Review reports against documents</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reportedDocs.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No reported documents found.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Reporter</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportedDocs.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell className="text-sm">
                                                    {report.target?.email || 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{report.type}</Badge>
                                                </TableCell>
                                                <TableCell>{report.target?.profile?.username || 'Unknown User'}</TableCell>
                                                <TableCell>{report.reporter?.profile?.username || 'Unknown'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={report.status === 'RESOLVED' ? 'default' : 'secondary'}>
                                                        {report.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" variant="ghost" onClick={() => handlePreviewReportedDoc(report)} title="Preview Document">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => handleReviewReport(report)}>
                                                            Review
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Preview Dialog */}
            <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{previewDoc?.title}</DialogTitle>
                        <DialogDescription>
                            Uploaded by {previewDoc?.author.profile.username} on{' '}
                            {previewDoc && new Date(previewDoc.createdAt).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>
                    {previewDoc && renderPreview(previewDoc)}
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            {dialog}

            {/* Review Dialog */}
            {selectedReport && (
                <ModerationReviewDialog
                    open={reviewDialogOpen}
                    onOpenChange={setReviewDialogOpen}
                    report={selectedReport}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}
        </div>
    )
}
