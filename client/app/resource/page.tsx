'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Download, Search, X, Trash2, Eye, Flag, Calculator, Atom, FlaskConical, Dna, BookOpen, Monitor } from "lucide-react";
import { getResources, deleteResource, downloadResource } from "../resource/resourceAPI";
import { ReportModal, ReportTargetType } from "@/components/report-modal";

export default function ResourcePage() {
  const [items, setItems] = useState<any[] | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');


  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);


  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<{ id: string; title: string } | null>(null);


  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');


  const [currentUserId, setCurrentUserId] = useState<string | null>(null);


  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [resourceToReport, setResourceToReport] = useState<{ id: string; title: string } | null>(null);


  const [searchExpanded, setSearchExpanded] = useState(false);

  useEffect(() => {
    fetchResources();


    const token = Cookies.get('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId || payload.sub);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, []);

  const fetchResources = () => {
    setLoading(true);
    getResources()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size cannot exceed 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      alert('Please select a file and enter a title');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (subject) formData.append('subject', subject);
      if (grade) formData.append('grade', grade);

      const token = Cookies.get('accessToken');
      const res = await fetch('/api/resource', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      // Reset form and close dialog
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setSubject('');
      setGrade('');
      setUploadDialogOpen(false);
      fetchResources();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileExtension = (doc: any): string => {
    // Try to get from fileName first
    if (doc.fileName) {
      const ext = doc.fileName.split('.').pop()?.toUpperCase();
      if (ext) return ext;
    }
    // Fallback to fileType mapping
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-powerpoint': 'PPT',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'text/plain': 'TXT',
    };
    return typeMap[doc.fileType] || 'FILE';
  };

  const handleDelete = (id: string, title: string) => {
    setResourceToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!resourceToDelete) return;

    try {
      setLoading(true);
      await deleteResource(resourceToDelete.id);
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
      setError(null);
      fetchResources();
    } catch (e: any) {
      setDeleteDialogOpen(false);
      setResourceToDelete(null);

      let errorMessage = 'Failed to delete resource';
      if (e?.message?.includes('403')) {
        errorMessage = 'You do not have permission to delete this resource. Only the owner can delete it.';
      } else if (e?.message?.includes('404')) {
        errorMessage = 'Resource not found. It may have been already deleted.';
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadResource(id);
    } catch (e: any) {
      alert(e?.message || 'Failed to download resource');
    }
  };

  const handlePreview = (doc: any) => {
    // Open PDF in new tab for full-screen viewing
    if (doc.fileType === 'application/pdf' && doc.fileUrl) {
      const pdfUrl = `http://localhost:8888${doc.fileUrl}`;
      window.open(pdfUrl, '_blank');
    } else {
      alert('Preview is only available for PDF files');
    }
  };

  const handleReport = (id: string, title: string) => {
    setResourceToReport({ id, title });
    setReportDialogOpen(true);
  };



  const filtered = items?.filter((it) => {
    const matchesSearch = !query ||
      it.title?.toLowerCase().includes(query.toLowerCase()) ||
      it.subject?.toLowerCase().includes(query.toLowerCase());
    // Use selectedSubject for filtering when in subject view
    const matchesSubject = !selectedSubject || it.subject === selectedSubject;
    const matchesGrade = !gradeFilter || it.grade === gradeFilter;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  // Subject data with images
  const subjects = [
    { name: 'Mathematics', image: '/subjects/math.png', subtitle: 'Build strong problem-solving skills through algebra, geometry, and basic calculus.' },
    { name: 'Biology', image: '/subjects/biology.png', subtitle: 'Explore how living things work, from cells to ecosystems.' },
    { name: 'Chemistry', image: '/subjects/chemistry.png', subtitle: 'Understand substances, reactions, and chemical principles.' },
    { name: 'Physics', image: '/subjects/physics.png', subtitle: 'Discover how the physical world works through motion, energy, and forces' },
    { name: 'English', image: '/subjects/english.png', subtitle: 'Improve reading, writing, grammar, and communication skills.' },
    { name: 'Computer Science', image: '/subjects/computer_science.png', subtitle: 'Learn basic programming, algorithms, and problem-solving skills.' },
  ];

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {/* Left side - Title or Back + Subject */}
            {selectedSubject ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedSubject(null);
                    setSearchExpanded(false);
                    setQuery('');
                    setGradeFilter('');
                  }}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{selectedSubject}</h1>
                  <p className="text-muted-foreground text-sm">Browse and share study materials</p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="mb-2 text-3xl font-bold text-foreground">Resource Library</h1>
                <p className="text-muted-foreground">Access and share study materials with your study group</p>
              </div>
            )}

            {/* Right side - Search + Upload */}
            <div className="flex items-center gap-2">
              {/* Expandable Search */}
              {selectedSubject && (
                <div className="flex items-center">
                  {searchExpanded ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search documents..."
                          className="border-border bg-input pl-10 w-[300px] text-foreground placeholder:text-muted-foreground"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSearchExpanded(false);
                          setQuery('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSearchExpanded(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <Button
                onClick={() => {
                  // Auto-populate subject if on a subject page
                  if (selectedSubject) {
                    setSubject(selectedSubject);
                  }
                  setUploadDialogOpen(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </div>

          {/* Grade Filter - Only show in subject resources view */}
          {selectedSubject && (
            <div className="flex justify-end">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Grades</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>
          )}
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* SUBJECT CARDS VIEW - Show when no subject is selected */}
        {!selectedSubject && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Card
                key={subject.name}
                className="border-border bg-card cursor-pointer hover:shadow-lg transition-all overflow-hidden group p-0"
                onClick={() => setSelectedSubject(subject.name)}
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <img
                    src={subject.image}
                    alt={subject.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-card-foreground text-2xl font-semibold mb-2">{subject.name}</h3>
                  <p className="text-muted-foreground text-sm">{subject.subtitle}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* SUBJECT RESOURCES VIEW - Show when a subject is selected */}
        {selectedSubject && (
          <>
            {/* Documents Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(filtered ?? []).map((doc: any, index: number) => (
                <Card key={doc.id ?? index} className="border-border bg-card relative">
                  <CardHeader>
                    {/* Report flag icon in top-right corner */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-3 right-3 h-8 w-8 p-0 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                      onClick={() => handleReport(doc.id, doc.title)}
                      title="Report to Admin"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>

                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      {/* File type badge */}
                      <div className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                        {getFileExtension(doc)}
                      </div>
                    </div>
                    <CardTitle className="text-card-foreground pr-8">{doc.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {doc.subject} • {doc.fileSize ? formatFileSize(parseInt(doc.fileSize)) : 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {/* Action buttons - all in one row for PDFs */}
                    <div className="flex gap-2">
                      {/* Preview button for PDFs */}
                      {doc.fileType === 'application/pdf' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      )}

                      <Button
                        size="sm"
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleDownload(doc.id)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>

                      {doc.userId === currentUserId && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleDelete(doc.id, doc.title)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <div className="space-y-4">
              <DialogTitle className="text-2xl font-bold">Upload Document</DialogTitle>

              <Input
                placeholder="Document Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Computer Science">Computer Science</option>
                <option value="English">English</option>
              </select>

              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select Grade</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>

              <Textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedFile ? selectedFile.name : 'Select File'}
              </Button>

              {selectedFile && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">{selectedFile.name}</p>
                    <p className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!selectedFile || !title.trim() || loading}
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Delete Resource</DialogTitle>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground mb-1">You are about to delete:</p>
                <p className="font-semibold text-foreground">{resourceToDelete?.title}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this resource? This will permanently remove the file and all associated data.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setResourceToDelete(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] h-[90vh]">
            <div className="flex flex-col h-full">
              <div>
                <DialogTitle className="text-2xl font-bold">{previewTitle}</DialogTitle>
                <p className="text-sm text-muted-foreground">PDF Preview</p>
              </div>

              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full flex-1 border rounded"
                  title="PDF Preview"
                />
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setPreviewDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <ReportModal
          open={reportDialogOpen}
          onOpenChange={(open) => {
            setReportDialogOpen(open);
            if (!open) setResourceToReport(null);
          }}
          targetType={ReportTargetType.RESOURCE}
          targetId={resourceToReport?.id || ''}
          targetContent={resourceToReport?.title}
        />
      </main>
    </div>
  );
}
