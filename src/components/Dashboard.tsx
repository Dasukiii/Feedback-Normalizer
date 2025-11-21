import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Activity,
  LayoutDashboard,
  Inbox,
  CheckSquare,
} from 'lucide-react';
import {
  getRequests,
  getNotifications,
  deleteRequests,
  type Request,
  type Notification,
} from '../services/dataService';
import NewFeedbackForm from './NewFeedbackForm';
import RequestDetail from './RequestDetail';
import MyAssignments from './MyAssignments';
import ActivityFeed from './ActivityFeed';
import NotificationDrawer from './NotificationDrawer';

interface DashboardProps {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  onLogout: () => void;
}

type StatusFilter = 'all' | 'in-progress' | 'resolved' | 'closed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type OwnerFilter = 'all' | 'mine' | 'unassigned';
type SourceFilter = 'all' | 'email' | 'slack' | 'teams' | 'manual';

export default function Dashboard({
  userId,
  userName,
  userEmail,
  userRole,
  onLogout,
}: DashboardProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-assignments' | 'activity'>('dashboard');
  const [showNewFeedbackForm, setShowNewFeedbackForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, notificationsData] = await Promise.all([
        getRequests(),
        getNotifications(),
      ]);
      setRequests(requestsData);
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && request.priority !== priorityFilter) return false;
    if (ownerFilter === 'mine' && request.owner_id !== userId) return false;
    if (ownerFilter === 'unassigned' && request.owner_id) return false;
    if (sourceFilter !== 'all' && request.source !== sourceFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = request.description?.toLowerCase().includes(query);
      const matchesRequester = request.requester_name.toLowerCase().includes(query);
      if (!matchesDescription && !matchesRequester) return false;
    }
    return true;
  });

  const stats = {
    inProgress: requests.filter((r) => r.status === 'in-progress').length,
    overdue: requests.filter(
      (r) => r.due_date && new Date(r.due_date) < new Date() && r.status !== 'resolved'
    ).length,
    resolvedThisWeek: requests.filter((r) => {
      if (r.status !== 'resolved') return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(r.updated_at) > weekAgo;
    }).length,
    total: requests.length,
  };

  const toggleRequestSelection = (id: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === filteredRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(filteredRequests.map((r) => r.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRequests.size === 0) return;

    try {
      setIsDeletingBatch(true);
      await deleteRequests(Array.from(selectedRequests));
      setSelectedRequests(new Set());
      setShowBatchDeleteConfirm(false);
      await loadData();
    } catch (error) {
      console.error('Failed to delete requests:', error);
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return '🔴';
    if (priority === 'medium') return '🟡';
    return '🟢';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'in-progress': 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-600';
    const colors: Record<string, string> = {
      policy: 'bg-purple-100 text-purple-700',
      complaint: 'bg-red-100 text-red-700',
      suggestion: 'bg-green-100 text-green-700',
      question: 'bg-blue-100 text-blue-700',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  return (
    <>
      {/* Keep font consistent with landing & auth */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800&display=swap');
        :root{
          --glass-border: rgba(15,23,42,0.06);
          --glass-sheen: rgba(255,255,255,0.55);
          --accent-1: linear-gradient(90deg,#4f46e5,#06b6d4);
        }
        body { font-family: 'Figtree', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
      `}</style>

      <div className="min-h-screen bg-gray-50 antialiased">
        {/* Header / Topbar */}
        <header className="sticky top-0 z-30">
          <div
            className="bg-white/80 backdrop-blur-md border-b"
            style={{ borderColor: 'rgba(15,23,42,0.04)' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-6">
                  {/* Logo with subtle glass badge */}
                  <div className="inline-flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg,#eef2ff 0%, #e6fffa 100%)',
                        border: '1px solid rgba(15,23,42,0.04)',
                        boxShadow: '0 6px 18px rgba(2,6,23,0.06)',
                      }}
                    >
                      <Inbox className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Feedback Normalizer</div>
                      <div className="text-xs text-gray-400">Unified feedback & actions</div>
                    </div>
                  </div>

                  {/* Primary navigation */}
                  <nav className="hidden md:flex items-center gap-2 ml-6">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('my-assignments')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'my-assignments' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2"><CheckSquare className="w-4 h-4" /> My Assignments</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('activity')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'activity' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2"><Activity className="w-4 h-4" /> Activity</span>
                    </button>
                  </nav>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowNotificationDrawer(true)}
                    className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-600 text-white text-xs font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      aria-haspopup="true"
                      aria-expanded={showUserMenu}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#06b6d4)' }}
                      >
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-gray-900">{userName}</div>
                        <div className="text-xs text-gray-500">{userRole}</div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-900">{userName}</div>
                          <div className="text-xs text-gray-500">{userEmail}</div>
                        </div>
                        <button
                          onClick={onLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'my-assignments' ? (
            <MyAssignments onBack={() => setActiveTab('dashboard')} />
          ) : activeTab === 'activity' ? (
            <ActivityFeed
              userRole={userRole}
              userId={userId}
              onBack={() => setActiveTab('dashboard')}
            />
          ) : (
            <>
              {/* Page header */}
              <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900">Unified Inbox</h1>
                <p className="text-gray-600 mt-1">Manage all feedback requests & add new feedback</p>
              </div>

              {/* Stats row (liquid glass cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.32))',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(10px) saturate(120%)',
                    boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Requests</div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-white/60 text-gray-700 border border-white/50">
                      All
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.32))',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(10px) saturate(120%)',
                    boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
                      <div className="text-sm text-gray-600 mt-1">In Progress</div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-white/60 text-yellow-700 border border-white/50">
                      Active
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.32))',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(10px) saturate(120%)',
                    boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                      <div className="text-sm text-gray-600 mt-1">Overdue</div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-white/60 text-red-700 border border-white/50">
                      Alert
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.32))',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(10px) saturate(120%)',
                    boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.resolvedThisWeek}</div>
                      <div className="text-sm text-gray-600 mt-1">Resolved This Week</div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-white/60 text-green-700 border border-white/50">
                      Done
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters & New Request (glass panel) */}
              <div
                className="rounded-2xl overflow-hidden mb-6"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.36))',
                  border: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(12px) saturate(120%)',
                  boxShadow: '0 12px 36px rgba(2,6,23,0.06)',
                }}
              >
                {/* Tabs */}
                <div className="flex items-center gap-3 px-6 py-3 border-b border-white/60">
                  {(['all', 'in-progress', 'resolved', 'closed'] as StatusFilter[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                          statusFilter === status
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    )
                  )}
                </div>

                {/* Filter row */}
                <div className="p-6 border-b border-white/60">
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="flex-1 flex flex-col lg:flex-row gap-3 w-full">
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                        className="px-4 py-2 border border-white/60 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/40"
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      <select
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value as OwnerFilter)}
                        className="px-4 py-2 border border-white/60 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/40"
                      >
                        <option value="all">All Owners</option>
                        <option value="mine">Assigned to Me</option>
                        <option value="unassigned">Unassigned</option>
                      </select>

                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                        className="px-4 py-2 border border-white/60 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/40"
                      >
                        <option value="all">All Sources</option>
                        <option value="email">Email</option>
                        <option value="slack">Slack</option>
                        <option value="teams">Teams</option>
                        <option value="manual">Manual</option>
                      </select>

                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search feedback..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-white/60 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/40"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowNewFeedbackForm(true)}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition"
                        style={{
                          background: 'var(--accent-1)',
                          color: 'white',
                          boxShadow: '0 10px 26px rgba(79,70,229,0.12)',
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        New Request
                      </button>
                    </div>
                  </div>
                </div>

                {/* Batch action bar */}
                {selectedRequests.size > 0 && (
                  <div className="px-6 py-3 bg-white/40 border-t border-white/60 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedRequests.size} items selected
                    </span>
                    <div className="flex items-center gap-2">
                      <select className="px-3 py-1 border border-white/60 rounded-lg text-sm bg-white/30">
                        <option>Change Status</option>
                      </select>
                      <button
                        onClick={() => setShowBatchDeleteConfirm(true)}
                        className="px-3 py-1 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 transition-colors"
                      >
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}

                {/* Table or placeholders */}
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 mt-4">Loading requests...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="p-12 text-center">
                    <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No feedback requests yet</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first request to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-transparent">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                filteredRequests.length > 0 &&
                                selectedRequests.size === filteredRequests.length
                              }
                              onChange={toggleSelectAll}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Request
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-transparent divide-y divide-white/60">
                        {filteredRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-white/30 transition-colors cursor-pointer">
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedRequests.has(request.id)}
                                onChange={() => toggleRequestSelection(request.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4" onClick={() => setSelectedRequestId(request.id)}>
                              <div className="flex items-start gap-3">
                                <span className="text-lg mt-0.5">{getPriorityIcon(request.priority)}</span>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {request.requester_name}
                                  </div>
                                  <div className="text-sm text-gray-600 line-clamp-2">
                                    {request.description || request.raw_feedback.substring(0, 80)}
                                    {(request.description || request.raw_feedback).length > 80 && '...'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4" onClick={() => setSelectedRequestId(request.id)}>
                              {request.category && (
                                <span
                                  className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                                    request.category
                                  )}`}
                                >
                                  {request.category}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4" onClick={() => setSelectedRequestId(request.id)}>
                              <span
                                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                  request.status
                                )}`}
                              >
                                {request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4" onClick={() => setSelectedRequestId(request.id)}>
                              {request.owner_id ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gray-300 rounded-full" />
                                  <span className="text-sm text-gray-700">{request.owner?.name || 'Owner'}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4" onClick={() => setSelectedRequestId(request.id)}>
                              {request.creator ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                                    {request.creator.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm text-gray-700">{request.creator.name}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Unknown</span>
                              )}
                            </td>
                            <td className="px-6 py-4" onClick={() => setSelectedRequestId(request.id)}>
                              {request.due_date ? (
                                <span
                                  className={`text-sm ${
                                    new Date(request.due_date) < new Date()
                                      ? 'text-red-600 font-semibold'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {new Date(request.due_date).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4" onClick={() => setSelectedRequestId(request.id)}>
                              <span className="text-sm text-gray-500">
                                {getRelativeTime(request.created_at)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination (simple) */}
              {filteredRequests.length > 20 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page 1 of 1</span>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {showNewFeedbackForm && (
          <NewFeedbackForm
            onClose={() => setShowNewFeedbackForm(false)}
            onSuccess={() => {
              loadData();
            }}
          />
        )}

        {selectedRequestId && (
          <RequestDetail
            requestId={selectedRequestId}
            onClose={() => setSelectedRequestId(null)}
            onUpdate={() => {
              loadData();
            }}
          />
        )}

        {showBatchDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Selected Requests?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {selectedRequests.size} request{selectedRequests.size > 1 ? 's' : ''}?
                This action cannot be undone. All associated comments and activity will also be deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeletingBatch}
                  className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingBatch ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowBatchDeleteConfirm(false)}
                  disabled={isDeletingBatch}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <NotificationDrawer
          isOpen={showNotificationDrawer}
          onClose={() => {
            setShowNotificationDrawer(false);
            loadData();
          }}
          onNotificationClick={(requestId) => {
            setSelectedRequestId(requestId);
            setShowNotificationDrawer(false);
          }}
        />
      </div>
    </>
  );
}
