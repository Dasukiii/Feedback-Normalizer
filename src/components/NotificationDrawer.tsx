import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, MessageSquare, CheckCircle, Clock, Bell } from 'lucide-react';
import type { Notification } from '../services/dataService';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/dataService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (requestId: string) => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  onNotificationClick,
}: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      await deleteNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.request_id) {
      onNotificationClick(notification.request_id);
    }
    await loadNotifications();
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5" />;
      case 'assignment':
        return <Bell className="w-5 h-5" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5" />;
      case 'status_update':
        return <CheckCircle className="w-5 h-5" />;
      case 'due_date':
        return <Clock className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'assignment':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'comment':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'status_update':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'due_date':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* drawer - liquid glass style */}
      <div
        className="
          fixed right-0 top-0 h-full w-full max-w-md
          z-50 flex flex-col
          rounded-l-2xl overflow-hidden
          bg-white/30 backdrop-blur-xl border border-white/30
          shadow-[0_20px_60px_rgba(2,6,23,0.12)]
        "
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        <div className="sticky top-0 z-20 px-6 py-4 border-b border-white/30 bg-white/30 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/40 transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/40 text-gray-800 hover:bg-white/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/40 text-gray-800 hover:bg-white/50'
                }`}
              >
                Unread
              </button>
            </div>

            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading notifications...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-sm text-gray-600">You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    group cursor-pointer
                    rounded-lg p-3 transition-all
                    ${!notification.is_read ? 'ring-1 ring-blue-200 bg-white/40' : 'bg-white/30'}
                    border border-white/20
                    hover:shadow-lg
                  `}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {getRelativeTime(notification.created_at)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification.id);
                          }}
                          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
