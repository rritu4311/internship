'use client';

import { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data || []);
      } else {
        console.error('Error fetching notifications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      setMarkingAsRead(true);
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: notificationIds || [],
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            read: notificationIds ? 
              (notificationIds.includes(notification.id) ? true : notification.read) : 
              true
          }))
        );
      } else {
        console.error('Error marking notifications as read:', data.error);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const markAllAsRead = () => {
    markAsRead();
  };

  const markSingleAsRead = (notificationId: string) => {
    markAsRead([notificationId]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_status':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'new_application':
        return <BellIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'accepted':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) {
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
    
    switch (type) {
      case 'application_status':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'new_application':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'rejected':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'accepted':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <BellIcon className="w-8 h-8 mr-3" />
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Stay updated with your application status and important updates
              </p>
            </div>
            
            {unreadCount > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </span>
                <button
                  onClick={markAllAsRead}
                  disabled={markingAsRead}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {markingAsRead ? 'Marking...' : 'Mark All as Read'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You'll receive notifications about your applications and important updates here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl p-6 border transition-all duration-200 ${getNotificationColor(notification.type, notification.read)}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <button
                          onClick={() => markSingleAsRead(notification.id)}
                          className="ml-4 flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="Mark as read"
                        >
                          <XMarkIcon className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button (if needed in future) */}
        {notifications.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Refresh Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
