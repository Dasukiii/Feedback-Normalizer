import { useState, useEffect } from 'react';
import {
  Activity,
  User,
  FileText,
  MessageSquare,
  Calendar,
  Trash2,
  UserPlus,
  Download,
  Search,
  ChevronDown,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { getActivityFeed, getAllUsers, getActivityStats } from '../services/dataService';
import RequestDetail from './RequestDetail';

interface ActivityFeedProps {
  userRole: string;
  userId: string;
  onBack: () => void;
}

interface ActivityLog {
  id: string;
  action_type: string;
  description: string;
  details?: string;
  created_at: string;
  user_id: string;
  request_id: string;
  profiles?: {
    id: string;
    name: string;
    email: string;
  };
  requests?: {
    id: string;
    requester_name: string;
    description?: string;
  };
}

export default function ActivityFeed({ userRole, userId, onBack }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = userRole === 'admin';
  const pageTitle = isAdmin ? 'Audit Log' : 'Activity Feed';
  const pageSubtitle = isAdmin
    ? 'Complete system activity and user audit trail'
    : 'Your recent activity';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, actionTypeFilter, dateRangeFilter, userFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = isAdmin ? {} : { userId };
      const [activitiesData, usersData, statsData, allUsersData] = await Promise.all([
        getActivityFeed(filters),
        isAdmin ? getAllUsers() : Promise.resolve([]),
        getActivityStats(isAdmin ? undefined : userId),
        getAllUsers(),
      ]);
      setActivities(activitiesData);
      setUsers(usersData);
      setStats(statsData);
      setTotalUsersCount(allUsersData.length);
    } catch (error) {
      console.error('Failed to load activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activities];

    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter((a) => a.action_type === actionTypeFilter);
    }

    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateRangeFilter) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      filtered = filtered.filter((a) => new Date(a.created_at) >= startDate);
    }

    if (userFilter !== 'all') {
      if (userFilter === 'me') {
        filtered = filtered.filter((a) => a.user_id === userId);
      } else {
        filtered = filtered.filter((a) => a.user_id === userFilter);
      }
    }

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.description?.toLowerCase().includes(search) ||
          a.details?.toLowerCase().includes(search) ||
          a.requests?.requester_name?.toLowerCase().includes(search) ||
          a.profiles?.name?.toLowerCase().includes(search)
      );
    }

    setFilteredActivities(filtered);
  };

  const exportAuditReport = () => {
    const headers = [
      'Timestamp',
      'User',
      'Action Type',
      'Description',
      'Request',
      'Details',
    ];
    const rows = filteredActivities.map((a) => [
      new Date(a.created_at).toISOString(),
      a.profiles?.name || 'Unknown',
      a.action_type,
      a.description,
      a.requests?.requester_name || 'N/A',
      a.details || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getActivityIcon = (actionType: string) => {
    const icons: Record<string, any> = {
      created: FileText,
      status_changed: Activity,
      assigned: UserPlus,
      reassigned: UserPlus,
      commented: MessageSquare,
      due_date_changed: Calendar,
      deleted: Trash2,
    };
    const Icon = icons[actionType] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const getActivityColor = (actionType: string) => {
    const colors: Record<string, string> = {
      created: 'bg-blue-100 text-blue-600',
      status_changed: 'bg-green-100 text-green-600',
      assigned: 'bg-purple-100 text-purple-600',
      reassigned: 'bg-purple-100 text-purple-600',
      commented: 'bg-yellow-100 text-yellow-600',
      due_date_changed: 'bg-orange-100 text-orange-600',
      deleted: 'bg-red-100 text-red-600',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-600';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const groupActivitiesByDate = () => {
    const groups: Record<string, ActivityLog[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    filteredActivities.forEach((activity) => {
      const date = new Date(activity.created_at);
      const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      let groupKey: string;
      if (activityDate.getTime() === today.getTime()) {
        groupKey = 'Today';
      } else if (activityDate.getTime() === yesterday.getTime()) {
        groupKey = 'Yesterday';
      } else if (activityDate >= thisWeek) {
        groupKey = 'This Week';
      } else {
        groupKey = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">{pageSubtitle}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={exportAuditReport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export Audit Report
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last 24 Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.last24h || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalUsersCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="created">Created</option>
              <option value="assigned">Assigned</option>
              <option value="status_changed">Status Changed</option>
              <option value="commented">Commented</option>
              <option value="due_date_changed">Due Date Changed</option>
              <option value="deleted">Deleted</option>
            </select>

            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {isAdmin && (
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="me">Me</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {Object.entries(groupedActivities).length === 0 ? (
            <div className="p-8 text-center text-gray-500">No activity found</div>
          ) : (
            Object.entries(groupedActivities).map(([groupName, groupActivities]) => (
              <div key={groupName}>
                <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 z-10">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase">
                    {groupName}
                  </h3>
                </div>
                {groupActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(
                          activity.action_type
                        )}`}
                      >
                        {getActivityIcon(activity.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">
                                {activity.profiles?.name || 'Unknown User'}
                              </span>{' '}
                              {activity.description}
                            </p>
                            {activity.requests && (
                              <button
                                onClick={() => setSelectedRequestId(activity.request_id)}
                                className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                              >
                                <FileText className="w-3 h-3" />
                                {activity.requests.requester_name}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                            {activity.details && (
                              <div className="mt-2">
                                {expandedActivity === activity.id ? (
                                  <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                                    {activity.details}
                                    <button
                                      onClick={() => setExpandedActivity(null)}
                                      className="ml-2 text-blue-600 hover:text-blue-700"
                                    >
                                      Show less
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setExpandedActivity(activity.id)}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                  >
                                    Show details
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="flex-shrink-0 text-xs text-gray-500">
                            {formatTimestamp(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRequestId && (
        <RequestDetail
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onUpdate={() => {
            setSelectedRequestId(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
