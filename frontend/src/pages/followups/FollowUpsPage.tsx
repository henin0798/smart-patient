import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import { FollowUp, FollowUpStatus } from '../../types';
import { AppointmentCountdown } from '../../components/common/AppointmentCountdown';
import {
  Clock,
  Calendar,
  Stethoscope,
  Building2,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  CalendarClock,
  RotateCcw,
  Check,
  XCircle,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';

type StatusFilter = 'ALL' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';

export const FollowUpsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUp | null>(null);
  const [newDate, setNewDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: followUps = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: ['follow-ups'],
    queryFn: () => api.get<FollowUp[]>('/follow-ups'),
  });

  // Calculate nearest upcoming follow-up for countdown
  const nearestUpcoming = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingList = followUps
      .filter((fu) => fu.status === 'UPCOMING' || fu.status === 'ACKNOWLEDGED')
      .sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime());

    // Prefer future or today's date first
    const future = upcomingList.find((fu) => fu.followUpDate >= todayStr);
    return future || upcomingList[0] || null;
  }, [followUps]);

  // Filtered follow-ups based on tab
  const filteredFollowUps = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return followUps.filter((fu) => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'COMPLETED') return fu.status === 'COMPLETED';
      if (statusFilter === 'CANCELLED') return fu.status === 'CANCELLED';
      if (statusFilter === 'OVERDUE') {
        return (
          (fu.status === 'UPCOMING' || fu.status === 'ACKNOWLEDGED') &&
          fu.followUpDate < todayStr
        );
      }
      if (statusFilter === 'UPCOMING') {
        return (
          (fu.status === 'UPCOMING' || fu.status === 'ACKNOWLEDGED') &&
          fu.followUpDate >= todayStr
        );
      }
      return true;
    });
  }, [followUps, statusFilter]);

  // Mutation to update status (e.g. ACKNOWLEDGED or COMPLETED)
  const updateStatusMutation = useMutation({
    mutationFn: ({ followUpId, status }: { followUpId: number; status: FollowUpStatus }) =>
      api.put<FollowUp>(`/follow-ups/${followUpId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update follow-up status.');
    },
  });

  // Mutation to reschedule
  const rescheduleMutation = useMutation({
    mutationFn: ({
      followUpId,
      newFollowUpDate,
      reason,
    }: {
      followUpId: number;
      newFollowUpDate: string;
      reason?: string;
    }) =>
      api.put<FollowUp>(`/follow-ups/${followUpId}/reschedule`, {
        newFollowUpDate,
        rescheduleReason: reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
      setRescheduleTarget(null);
      setNewDate('');
      setRescheduleReason('');
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to reschedule follow-up.');
    },
  });

  const handleOpenReschedule = (fu: FollowUp) => {
    setRescheduleTarget(fu);
    setNewDate(fu.followUpDate);
    setRescheduleReason('');
    setErrorMessage(null);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !newDate) return;
    rescheduleMutation.mutate({
      followUpId: rescheduleTarget.followUpId,
      newFollowUpDate: newDate,
      reason: rescheduleReason,
    });
  };

  const getStatusBadge = (fu: FollowUp) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue =
      (fu.status === 'UPCOMING' || fu.status === 'ACKNOWLEDGED') &&
      fu.followUpDate < todayStr;

    if (isOverdue) {
      return (
        <Badge variant="error" size="sm">
          OVERDUE
        </Badge>
      );
    }

    switch (fu.status) {
      case 'COMPLETED':
        return <Badge variant="success" size="sm">COMPLETED</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge variant="info" size="sm">ACKNOWLEDGED</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="warning" size="sm">UPCOMING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Follow-up Tracking & Reminders</h1>
        <p className="text-sm text-brand-muted mt-1">
          Stay on top of clinical recommendations, post-treatment reviews, and scheduled follow-ups with live countdown timers.
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-brand-error text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Countdown Banner for nearest upcoming review */}
      {nearestUpcoming && (
        <AppointmentCountdown
          targetDateTime={nearestUpcoming.followUpDate}
          title="Next Scheduled Clinical Review"
          subtitle={`Recommended by ${nearestUpcoming.doctor?.fullName || 'Physician'} (${nearestUpcoming.doctor?.specialty || 'General'})`}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border pb-2">
        {(['ALL', 'UPCOMING', 'OVERDUE', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === tab
                ? 'bg-brand-navy text-white shadow-sm'
                : 'text-brand-muted hover:bg-slate-200 hover:text-brand-navy'
            }`}
          >
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Follow-up Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-brand-muted">Loading clinical follow-ups...</div>
      ) : filteredFollowUps.length === 0 ? (
        <Card className="py-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-brand-navy">
            {statusFilter === 'ALL'
              ? 'No follow-ups recorded'
              : `No ${statusFilter.toLowerCase()} follow-ups`}
          </h3>
          <p className="text-xs text-brand-muted mt-1 max-w-md mx-auto">
            Clinical follow-up dates recommended by your doctor during consultations will appear here with automated reminders.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFollowUps.map((fu) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isOverdue =
              (fu.status === 'UPCOMING' || fu.status === 'ACKNOWLEDGED') &&
              fu.followUpDate < todayStr;

            return (
              <Card key={fu.followUpId} hoverEffect className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-brand-border">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-600'
                            : fu.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-brand-warning'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                          Review Target Date
                        </div>
                        <div className="text-base font-bold text-brand-navy">
                          {fu.followUpDate}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(fu)}
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs text-brand-muted">
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-brand-teal shrink-0" />
                      <span className="font-semibold text-brand-navy">{fu.doctor?.fullName}</span>
                      <span>({fu.doctor?.specialty})</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold text-brand-navy block mb-0.5">Clinical Purpose:</span>
                      {fu.reason}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-brand-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {fu.status === 'UPCOMING' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            followUpId: fu.followUpId,
                            status: 'ACKNOWLEDGED',
                          })
                        }
                        className="text-xs text-brand-muted hover:text-brand-navy flex items-center gap-1"
                        title="Mark as seen"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> Acknowledge
                      </button>
                    )}

                    {(fu.status === 'UPCOMING' || fu.status === 'ACKNOWLEDGED') && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            followUpId: fu.followUpId,
                            status: 'COMPLETED',
                          })
                        }
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1"
                        title="Mark follow-up completed"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    )}

                    {(fu.status === 'UPCOMING' || fu.status === 'ACKNOWLEDGED') && (
                      <button
                        onClick={() => handleOpenReschedule(fu)}
                        className="text-xs text-brand-navy hover:text-brand-teal font-medium flex items-center gap-1"
                        title="Request reschedule"
                      >
                        <CalendarClock className="w-3.5 h-3.5" /> Reschedule
                      </button>
                    )}
                  </div>

                  <div className="ml-auto">
                    {fu.doctor?.doctorId && fu.status !== 'COMPLETED' && fu.status !== 'CANCELLED' && (
                      <Button
                        variant="teal"
                        size="sm"
                        onClick={() =>
                          navigate(`/appointments?bookDoctorId=${fu.doctor.doctorId}`)
                        }
                        icon={<Calendar className="w-3.5 h-3.5" />}
                      >
                        Book Visit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <Dialog
          isOpen={true}
          onClose={() => setRescheduleTarget(null)}
          title="Reschedule Follow-up Date"
          description={`Change target review date for consultation with ${rescheduleTarget.doctor?.fullName || 'Physician'}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmReschedule} className="space-y-4">
            <Input
              label="New Follow-up Date"
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />

            <Input
              label="Reason for Rescheduling (Optional)"
              placeholder="e.g. Patient traveling, waiting on lab results"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRescheduleTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="teal"
                size="sm"
                isLoading={rescheduleMutation.isPending}
              >
                Update Date
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
