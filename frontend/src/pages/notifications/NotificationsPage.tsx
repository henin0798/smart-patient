import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Calendar, 
  Pill, 
  Share2, 
  ShieldCheck, 
  FileText, 
  CheckCheck, 
  Clock 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../lib/api-client';
import { NotificationItem } from '../../types';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const { data: notifications, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications')
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.post('/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'APPOINTMENT':
      case 'APPOINTMENT_BOOKED':
      case 'APPOINTMENT_CANCELLED':
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      case 'PRESCRIPTION':
      case 'MEDICINE':
      case 'MEDICINE_REMINDER':
        return <Pill className="w-5 h-5 text-teal-600" />;
      case 'RECORD_SHARE':
      case 'SHARE_REVOKED':
        return <Share2 className="w-5 h-5 text-amber-600" />;
      case 'REPORT':
      case 'REPORT_UPLOADED':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'DOCTOR_VERIFIED':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const filtered = (notifications || []).filter(item => {
    if (filter === 'UNREAD') return !item.isRead;
    return true;
  });

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-900">Notifications & Alerts</h1>
            {unreadCount > 0 && (
              <Badge variant="warning">{unreadCount} New</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time reminders for scheduled doses, appointments, clinical reports & access updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              isLoading={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1.5 text-teal-600" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-navy-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({(notifications || []).length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'UNREAD'
              ? 'bg-navy-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center p-12">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-navy-900">You're All Caught Up</h3>
          <p className="text-sm text-slate-500 mt-1">
            {filter === 'UNREAD' 
              ? 'No unread notifications at this time.' 
              : 'System alerts, dose reminders, and doctor updates will appear here.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card 
              key={item.notificationId}
              className={`transition-all duration-150 ${
                !item.isRead ? 'border-l-4 border-l-teal-600 bg-teal-50/20' : 'opacity-85'
              }`}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(item.notificationType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-navy-900">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!item.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-teal-700 hover:text-teal-800 shrink-0"
                    onClick={() => markAsReadMutation.mutate(item.notificationId)}
                    isLoading={markAsReadMutation.isPending}
                  >
                    Mark as Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
