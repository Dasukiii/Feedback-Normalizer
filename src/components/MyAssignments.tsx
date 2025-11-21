import { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  User,
  ChevronDown,
  Download,
} from 'lucide-react';
import {
  getMyAssignments,
  getAssignmentStats,
  updateRequestStatus,
  assignRequest,
  type Request,
} from '../services/dataService';
import RequestDetail from './RequestDetail';

interface MyAssignmentsProps {
  onBack: () => void;
}

type DueDateFilter = 'all' | 'overdue' | 'this_week' | 'this_month';

export default function MyAssignments({ onBack }: MyAssignmentsProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, priorityFilter, dueDateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, statsData] = await Promise.all([
        getMyAssignments(),
        getAssignmentStats(),
      ]);
      setRequests(assignmentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    if (dueDateFilter !== 'all') {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (dueDateFilter === 'overdue') {
        filtered = filtered.filter(
          (r) => r.due_date && new Date(r.due_date) < now && r.status !== 'resolved' && r.status !== 'closed'
        );
      } else if (dueDateFilter === 'this_week') {
        filtered = filtered.filter(
          (r) => r.due_date && new Date(r.due_date) >= now && new Date(r.due_date) <= weekFromNow
        );
      } else if (dueDateFilter === 'this_month') {
        filtered = filtered.filter(
          (r) => r.due_date && new Date(r.due_date) >= now && new Date(r.due_date) <= monthFromNow
        );
      }
    }

    setFilteredRequests(filtered);
  };

  const handleMarkComplete = async (requestId: string) => {
    try {
      await updateRequestStatus(requestId, 'resolved');
      await loadData();
    } catch (error) {
      console.error('Failed to mark complete:', error);
    }
  };

  const handleUnassign = async (requestId: string) => {
    try {
      await assignRequest(requestId, null);
      await loadData();
    } catch (error) {
      console.error('Failed to unassign:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Requester', 'Description', 'Priority', 'Status', 'Due Date', 'Created'];
    const rows = filteredRequests.map((r) => [
      r.id.slice(0, 8).toUpperCase(),
      r.requester_name,
      r.description || r.raw_feedback.substring(0, 100),
      r.priority,
      r.status,
      r.due_date || '',
      new Date(r.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-assignments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const isOverdue = (request: Request) => {
    if (!request.due_date) return false;
    return new Date(request.due_date) < new Date() && request.status !== 'resolved' && request.status !== 'closed';
  };

  const getWorkloadColor = (count: number) => {
    if (count <= 10) return 'bg-green-500';
    if (count <= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getWorkloadPercentage = (count: number) => {
    return Math.min((count / 30) * 100, 100);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-700 border-red-300';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-1">Feedback requests assigned to you</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.inProgressCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.dueThisWeek || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">My Requests</h3>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value as DueDateFilter)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Due Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No assignments found
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          isOverdue(request) ? 'bg-red-50' : ''
                        }`}
                        onClick={() => setSelectedRequestId(request.id)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {request.requester_name}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {request.description || request.raw_feedback}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                              request.priority
                            )}`}
                          >
                            {request.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {request.due_date ? (
                            <span
                              className={`text-sm ${
                                isOverdue(request)
                                  ? 'text-red-600 font-semibold'
                                  : 'text-gray-700'
                              }`}
                            >
                              {new Date(request.due_date).toLocaleDateString()}
                              {isOverdue(request) && (
                                <span className="ml-1 text-xs">(Overdue)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            {request.status !== 'resolved' && request.status !== 'closed' && (
                              <button
                                onClick={() => handleMarkComplete(request.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleUnassign(request.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              <User className="w-3 h-3" />
                              Unassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Handled This Month</span>
                <span className="text-lg font-bold text-gray-900">{stats?.thisMonthResolved || 0}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Avg Completion Time</span>
                <span className="text-lg font-bold text-gray-900">{stats?.avgResponseTime || 0}h</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">On-Time Rate</span>
                <span className="text-lg font-bold text-green-600">{stats?.onTimeRate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Completion Rate</span>
                <span className="text-lg font-bold text-blue-600">{stats?.completionRate || 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
            <h4 className="text-sm font-bold text-blue-900 mb-2">Quick Tip</h4>
            <p className="text-sm text-blue-800">
              Keep your response time low by addressing high-priority items first and updating due
              dates as needed.
            </p>
          </div>
        </div>
      </div>

      {selectedRequestId && (
        <RequestDetail
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onUpdate={() => {
            loadData();
            setSelectedRequestId(null);
          }}
        />
      )}
    </div>
  );
}
