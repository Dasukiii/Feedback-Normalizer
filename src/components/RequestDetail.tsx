import { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Calendar,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  AlertCircle,
  MessageSquare,
  Activity,
  FileDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import type { Request } from '../services/dataService';
import {
  getRequestById,
  updateRequestStatus,
  assignRequest,
  addComment,
  deleteRequest,
  updateRequest,
  getCommentsWithProfiles,
  getActivityLogWithProfiles,
  getCurrentUser,
  getAllUsers,
  createNotification,
} from '../services/dataService';

interface RequestDetailProps {
  requestId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function RequestDetail({ requestId, onClose, onUpdate }: RequestDetailProps) {
  const [request, setRequest] = useState<Request | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showOriginalFeedback, setShowOriginalFeedback] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState('');

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, [requestId]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUserId(user?.id || null);
      setCurrentUserRole(user?.role || '');

      if (user?.role === 'admin' || user?.role === 'manager') {
        const users = await getAllUsers();
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [requestData, commentsData, activityData] = await Promise.all([
        getRequestById(requestId),
        getCommentsWithProfiles(requestId),
        getActivityLogWithProfiles(requestId),
      ]);

      if (!requestData) {
        setError('Request not found');
        return;
      }

      setRequest(requestData);
      setComments(commentsData);
      setActivityLog(activityData);
      setDueDate(requestData.due_date || '');
    } catch (error) {
      console.error('Failed to load request details:', error);
      setError('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;

    try {
      const oldStatus = request.status;
      await updateRequestStatus(request.id, newStatus);

      if (request.owner_id && currentUserId && request.owner_id !== currentUserId) {
        await createNotification({
          user_id: request.owner_id,
          type: 'status_update',
          title: 'Status Updated',
          message: `Status changed from ${oldStatus} to ${newStatus} for "${request.description?.substring(0, 50)}..."`,
          request_id: request.id,
          created_by: currentUserId,
        });
      }

      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      setError('Failed to update status');
    }
  };

  const handleAssignToMe = async () => {
    if (!request || !currentUserId) return;

    try {
      await assignRequest(request.id, currentUserId);

      if (request.user_id && request.user_id !== currentUserId) {
        await createNotification({
          user_id: currentUserId,
          type: 'assignment',
          title: 'New Assignment',
          message: `You've been assigned: "${request.description?.substring(0, 60)}..."`,
          request_id: request.id,
          created_by: currentUserId,
        });
      }

      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to assign request:', error);
      setError('Failed to assign request');
    }
  };

  const handleAssignToUser = async (userId: string) => {
    if (!request) return;

    try {
      await assignRequest(request.id, userId);

      if (userId && currentUserId) {
        await createNotification({
          user_id: userId,
          type: 'assignment',
          title: 'New Assignment',
          message: `You've been assigned: "${request.description?.substring(0, 60)}..."`,
          request_id: request.id,
          created_by: currentUserId,
        });
      }

      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to assign request:', error);
      setError('Failed to assign request');
    }
  };

  const handleUnassign = async () => {
    if (!request) return;

    try {
      await assignRequest(request.id, null);
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to unassign request:', error);
      setError('Failed to unassign request');
    }
  };

  const handleAddNote = async () => {
    if (!request || !newNote.trim()) return;

    try {
      setAddingNote(true);
      await addComment(request.id, newNote, true);

      if (request.owner_id && currentUserId && request.owner_id !== currentUserId) {
        await createNotification({
          user_id: request.owner_id,
          type: 'comment',
          title: 'New Comment',
          message: `Someone commented on "${request.description?.substring(0, 50)}..."`,
          request_id: request.id,
          created_by: currentUserId,
        });
      }

      setNewNote('');
      await loadData();
    } catch (error) {
      console.error('Failed to add note:', error);
      setError('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateDueDate = async () => {
    if (!request) return;

    try {
      await updateRequest(request.id, { due_date: dueDate || undefined });
      setEditingDueDate(false);
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Failed to update due date:', error);
      setError('Failed to update due date');
    }
  };

  const handleDelete = async () => {
    if (!request) return;

    try {
      await deleteRequest(request.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete request:', error);
      onUpdate();
      onClose();
    }
  };

  const handleExportToPDF = () => {
    if (!request) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = 25;

    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 25) {
        doc.addPage();
        yPosition = 25;
        return true;
      }
      return false;
    };

    const drawSectionBox = (startY: number, height: number, color: [number, number, number]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin - 5, startY - 8, contentWidth + 10, height + 12, 3, 3, 'F');
    };

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Feedback Request Report', margin, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(`REQ-${request.id.slice(0, 8).toUpperCase()}`, margin, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 55, 35);

    yPosition = 60;

    const aiBoxStartY = yPosition;
    const descLines = doc.splitTextToSize(request.description || 'No description available', contentWidth - 10);
    const aiBoxHeight = 45 + descLines.length * 5;
    drawSectionBox(aiBoxStartY, aiBoxHeight, [248, 250, 252]);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('AI Analysis', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text(descLines, margin, yPosition);
    yPosition += descLines.length * 5 + 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const metadataItems = [
      { label: 'Category', value: request.category || 'N/A' },
      { label: 'Priority', value: request.priority?.toUpperCase() || 'N/A' },
      { label: 'Status', value: request.status || 'N/A' },
      { label: 'Suggested Owner', value: request.suggested_owner || 'N/A' },
    ];

    metadataItems.forEach((item) => {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}: `, margin, yPosition);
      const labelWidth = doc.getTextWidth(`${item.label}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(item.value, margin + labelWidth, yPosition);
      yPosition += 6;
    });

    if (request.tags && request.tags.length > 0) {
      yPosition += 2;
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('Tags: ', margin, yPosition);
      const labelWidth = doc.getTextWidth('Tags: ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(request.tags.join(', '), margin + labelWidth, yPosition);
    }

    yPosition += 20;
    checkPageBreak(30);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Original Feedback', margin, yPosition);
    yPosition += 12;

    const rawFeedback = request.raw_feedback || 'No feedback available';
    const paragraphs = rawFeedback.split(/\n\s*\n/).filter((p: string) => p.trim());

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    paragraphs.forEach((paragraph: string, index: number) => {
      const lines = paragraph.split('\n');

      lines.forEach((line: string) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const isHeader = /^[A-Z][A-Za-z\s]+[:\-]?$/.test(trimmedLine) ||
                        /^[A-Z]{2,}/.test(trimmedLine) ||
                        /^\d+\./.test(trimmedLine) ||
                        trimmedLine.endsWith(':');

        checkPageBreak(isHeader ? 15 : 8);

        if (isHeader) {
          yPosition += 4;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          const headerLines = doc.splitTextToSize(trimmedLine, contentWidth);
          doc.text(headerLines, margin, yPosition);
          yPosition += headerLines.length * 5 + 3;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
        } else {
          const textLines = doc.splitTextToSize(trimmedLine, contentWidth);
          textLines.forEach((textLine: string) => {
            checkPageBreak(6);
            doc.text(textLine, margin, yPosition);
            yPosition += 5;
          });
        }
      });

      if (index < paragraphs.length - 1) {
        yPosition += 6;
      }
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    const fileName = `Feedback_${request.requester_name?.replace(/\s+/g, '_') || 'Request'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-500 text-white border-red-600';
    if (priority === 'medium') return 'bg-yellow-500 text-white border-yellow-600';
    return 'bg-green-500 text-white border-green-600';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Policy Question': 'bg-purple-100 text-purple-700',
      Complaint: 'bg-red-100 text-red-700',
      Suggestion: 'bg-green-100 text-green-700',
      'Information Request': 'bg-blue-100 text-blue-700',
      Escalation: 'bg-orange-100 text-orange-700',
      'Benefits Question': 'bg-cyan-100 text-cyan-700',
      General: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white/30 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/30 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white/30 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/30">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-700 mb-6">{error || 'Request not found'}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/60 text-gray-900 rounded-lg hover:bg-white/70 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className="
          w-full max-w-5xl my-4
          rounded-2xl overflow-hidden
          border border-white/30
          bg-white/30 backdrop-blur-xl
          shadow-[0_20px_60px_rgba(2,6,23,0.12)]
        "
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b border-white/30 bg-white/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-700">REQ-{request.id.slice(0, 8).toUpperCase()}</span>
                <select
                  value={request.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}
                >
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(request.priority)}`}>
                  {request.priority.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToPDF}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Save to PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/40 transition-colors"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl p-4 border border-white/20 bg-white/20">
              <h3 className="text-base font-bold text-gray-900 mb-3">Requester Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{request.requester_name}</p>
                  </div>
                </div>
                {request.requester_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <a
                        href={`mailto:${request.requester_email}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {request.requester_email}
                      </a>
                    </div>
                  </div>
                )}
                {request.requester_department && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Department</p>
                      <p className="text-sm font-medium text-gray-900">{request.requester_department}</p>
                    </div>
                  </div>
                )}
              </div>
              {request.requester_email && (
                <a
                  href={`mailto:${request.requester_email}`}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white/60 text-gray-900 rounded-lg hover:bg-white/70 transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  Contact
                </a>
              )}
            </div>

            <div className="rounded-xl p-4 border border-white/20 bg-white/20">
              <h3 className="text-base font-bold text-gray-900 mb-3">Feedback Details</h3>
              <div className="space-y-3">
                {request.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1.5">AI Analysis</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Description</p>
                        <p className="text-sm text-gray-900">{request.description}</p>
                      </div>
                      {request.category && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Category</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(request.category)}`}>
                            {request.category}
                          </span>
                        </div>
                      )}
                      {request.tags && request.tags.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {request.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-white/40 text-gray-800 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {request.suggested_owner && (
                        <div>
                          <p className="text-xs text-gray-600">Suggested Owner</p>
                          <p className="text-sm text-gray-900">{request.suggested_owner}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <button
                    onClick={() => setShowOriginalFeedback(!showOriginalFeedback)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Original Feedback
                    {showOriginalFeedback ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showOriginalFeedback && (
                    <div className="mt-2 rounded-lg p-3 max-h-40 overflow-y-auto bg-white/10 border border-white/10">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{request.raw_feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4 border border-white/20 bg-white/20">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activity Timeline
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activityLog.length === 0 ? (
                  <p className="text-gray-600 text-xs">No activity yet</p>
                ) : (
                  <div className="space-y-2">
                    {activityLog.map((activity) => (
                      <div key={activity.id} className="flex gap-2 pb-2 border-b border-white/10 last:border-0">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center">
                            <Activity className="w-3 h-3 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-900">{activity.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {activity.profiles && (
                              <span className="text-[10px] text-gray-600">by {activity.profiles.name}</span>
                            )}
                            <span className="text-[10px] text-gray-500">{formatDate(activity.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl p-4 border border-white/20 bg-white/20">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Internal Notes
              </h3>
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-gray-600 text-xs">No notes yet</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg p-3 bg-white/10">
                        <p className="text-sm text-gray-900">{comment.content}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {comment.profiles && (
                            <span className="text-[10px] font-medium text-gray-700">{comment.profiles.name}</span>
                          )}
                          <span className="text-[10px] text-gray-500">{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/10 border border-white/10 text-gray-900"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addingNote}
                    className="mt-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl p-4 border border-white/20 bg-white/20">
              <h3 className="text-base font-bold text-gray-900 mb-3">Assignment</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1.5">
                    {request.owner_id ? 'Assigned to' : 'Unassigned'}
                  </p>
                  {request.owner_id && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {request.owner?.name || 'Assigned'}
                      </p>
                    </div>
                  )}
                </div>

                {(currentUserRole === 'admin' || currentUserRole === 'manager') && allUsers.length > 0 ? (
                  <div>
                    <select
                      value={request.owner_id || ''}
                      onChange={(e) => {
                        const userId = e.target.value;
                        if (userId) {
                          handleAssignToUser(userId);
                        } else {
                          handleUnassign();
                        }
                      }}
                      className="w-full px-3 py-1.5 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/10 border border-white/10 text-gray-900"
                    >
                      <option value="">Unassigned</option>
                      {allUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!request.owner_id && (
                      <button
                        onClick={handleAssignToMe}
                        className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Assign to Me
                      </button>
                    )}
                    {request.owner_id && (
                      <button
                        onClick={handleUnassign}
                        className="w-full px-3 py-1.5 text-sm border border-white/10 text-gray-900 rounded-lg hover:bg-white/40"
                      >
                        Unassign
                      </button>
                    )}
                  </div>
                )}


                <div>
                  <p className="text-xs text-gray-600 mb-1.5">Due Date</p>
                  {editingDueDate ? (
                    <div className="space-y-1.5">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/10 border border-white/10 text-gray-900"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleUpdateDueDate}
                          className="flex-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingDueDate(false);
                            setDueDate(request.due_date || '');
                          }}
                          className="flex-1 px-2 py-1 border border-white/10 text-gray-900 rounded-lg hover:bg-white/40 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingDueDate(true)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/40 border border-white/10"
                    >
                      <Calendar className="w-3 h-3 text-gray-600" />
                      <span className="text-xs text-gray-900">
                        {request.due_date ? new Date(request.due_date).toLocaleDateString() : 'Set due date'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4 border border-white/20 bg-white/20">
              <h3 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Request
                </button>
              </div>
            </div>

            <div className="rounded-xl p-4 border border-white/20 bg-white/20">
              <h3 className="text-base font-bold text-gray-900 mb-3">Metadata</h3>
              <div className="space-y-2 text-xs">
                {request.creator && (
                  <div>
                    <p className="text-gray-600">Created By</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 bg-white/40 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {request.creator.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{request.creator.name}</p>
                        <p className="text-gray-600 text-[10px]">{request.creator.role}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="text-gray-900 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-gray-600" />
                    {formatDate(request.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Updated</p>
                  <p className="text-gray-900 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-gray-600" />
                    {formatDate(request.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white/30 backdrop-blur-md rounded-2xl p-5 max-w-sm w-full border border-white/30">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Request?</h3>
            <p className="text-sm text-gray-700 mb-4">
              This action cannot be undone. All associated comments and activity will also be deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-1.5 text-sm border border-white/10 text-gray-900 rounded-lg hover:bg-white/40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
